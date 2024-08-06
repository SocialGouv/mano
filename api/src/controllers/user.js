const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const { validatePassword, looseUuidRegex, jwtRegex, sanitizeAll, headerJwtRegex } = require("../utils");
const mailservice = require("../utils/mailservice");
const config = require("../config");
const { comparePassword } = require("../utils");
const { User, RelUserTeam, Team, Organisation, UserLog } = require("../db/sequelize");
const validateUser = require("../middleware/validateUser");
const { capture } = require("../sentry");
const { ExtractJwt } = require("passport-jwt");
const { serializeUserWithTeamsAndOrganisation, serializeTeam } = require("../utils/data-serializer");
const { mailBienvenueHtml } = require("../utils/mail-bienvenue");

const EMAIL_OR_PASSWORD_INVALID = "EMAIL_OR_PASSWORD_INVALID";
const PASSWORD_NOT_VALIDATED = "PASSWORD_NOT_VALIDATED";

const passwordCheckError =
  "Le mot de passe n'est pas valide. Il doit comprendre 8 caractères, au moins une lettre, un chiffre et un caractère spécial";

const JWT_MAX_AGE = 60 * 60 * 13; // 13 hours in s, a bit more than a working day, so disconnect every night
const COOKIE_MAX_AGE = JWT_MAX_AGE * 1000;

function cookieOptions() {
  if (config.ENVIRONMENT === "development" || config.ENVIRONMENT === "test") {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, sameSite: "None" };
  } else {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, domain: ".sesan.fr", sameSite: "Lax" };
  }
}

function logoutCookieOptions() {
  if (config.ENVIRONMENT === "development" || config.ENVIRONMENT === "test") {
    return { httpOnly: true, secure: true, sameSite: "None" };
  } else {
    return { httpOnly: true, secure: true, domain: ".sesan.fr", sameSite: "Lax" };
  }
}

function createUserLog(req, user) {
  if (req.headers.platform === "android") {
    try {
      z.object({
        version: z.optional(z.string()),
        apilevel: z.optional(z.number()),
        brand: z.optional(z.string()),
        carrier: z.optional(z.string()),
        device: z.optional(z.string()),
        deviceid: z.optional(z.string()),
        freediskstorage: z.optional(z.number()),
        hardware: z.optional(z.string()),
        manufacturer: z.optional(z.string()),
        maxmemory: z.optional(z.number()),
        model: z.optional(z.string()),
        product: z.optional(z.string()),
        readableversion: z.optional(z.string()),
        systemname: z.optional(z.string()),
        systemversion: z.optional(z.string()),
        buildid: z.optional(z.string()),
        totaldiskcapacity: z.optional(z.number()),
        totalmemory: z.optional(z.number()),
        useragent: z.optional(z.string()),
        tablet: z.optional(z.boolean()),
      }).parse(req.body);
    } catch (e) {
      capture(e, { extra: { body: req.body }, user });
      return;
    }
    UserLog.create({
      user: user._id,
      organisation: user.organisation,
      platform: "app",
      action: "login",
      debugApp: {
        version: req.headers.version,
        apilevel: req.body.apilevel,
        brand: req.body.brand,
        carrier: req.body.carrier,
        device: req.body.device,
        deviceid: req.body.deviceid,
        freediskstorage: req.body.freediskstorage,
        hardware: req.body.hardware,
        manufacturer: req.body.manufacturer,
        maxmemory: req.body.maxmemory,
        model: req.body.model,
        product: req.body.product,
        readableversion: req.body.readableversion,
        systemname: req.body.systemname,
        systemversion: req.body.systemversion,
        buildid: req.body.buildid,
        totaldiskcapacity: req.body.totaldiskcapacity,
        totalmemory: req.body.totalmemory,
        useragent: req.body.useragent,
        tablet: req.body.tablet,
      },
    });
  } else if (req.headers.platform === "dashboard") {
    try {
      z.object({
        body: z.object({
          browsertype: z.optional(z.string()),
          browsername: z.optional(z.string()),
          browserversion: z.optional(z.string()),
          browseros: z.optional(z.string()),
        }),
        headers: z.object({
          version: z.optional(z.string()),
        }),
      }).parse(req);
    } catch (e) {
      capture(e, { extra: { body: req.body }, user });
      return;
    }
    UserLog.create({
      user: user._id,
      organisation: user.organisation,
      platform: "dashboard",
      action: "login",
      debugDashboard: {
        browserType: req.body.browsertype,
        browserName: req.body.browsername,
        browserVersion: req.body.browserversion,
        browserOs: req.body.browseros,
        version: req.headers.version,
      },
    });
  } else {
    UserLog.create({
      user: user._id,
      organisation: user.organisation,
      platform: "unknown",
      action: "login",
    });
  }
}

router.get(
  "/me",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "superadmin", "restricted-access", "stats-only"]),
  catchErrors(async (req, res) => {
    const user = await User.findOne({ where: { _id: req.user._id } });
    const teams = await user.getTeams();
    const organisation = await user.getOrganisation();
    const orgTeams = await Team.findAll({ where: { organisation: organisation._id } });
    return res.status(200).send({
      ok: true,
      user: serializeUserWithTeamsAndOrganisation(user, teams, organisation, orgTeams),
    });
  })
);

router.post(
  "/logout",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "superadmin", "restricted-access", "stats-only"]),
  catchErrors(async (req, res) => {
    UserLog.create({
      organisation: req.user.organisation,
      user: req.user._id,
      platform: req.headers.platform === "android" ? "app" : req.headers.platform === "dashboard" ? "dashboard" : "unknown",
      action: "logout",
    });
    res.clearCookie("jwt", logoutCookieOptions());
    return res.status(200).send({ ok: true });
  })
);

router.post(
  "/signin",
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        password: z.string(),
        email: z.preprocess((email) => email.trim().toLowerCase(), z.string().email().optional().or(z.literal(""))),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in signin: ${e}`);
      error.status = 400;
      return next(error);
    }
    const now = new Date();
    let { password, email } = req.body;
    if (!password || !email) return res.status(400).send({ ok: false, error: "Missing password" });
    email = (email || "").trim().toLowerCase();

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(403).send({ ok: false, error: "E-mail ou mot de passe incorrect", code: EMAIL_OR_PASSWORD_INVALID });
    if (user.loginAttempts > 12 || user.decryptAttempts > 12) {
      return res.status(403).send({ ok: false, error: "Trop de tentatives de connexions infructueuses, le compte n'est plus accessible" });
    }

    if (user.nextLoginAttemptAt && user.nextLoginAttemptAt > now) {
      const displayTime = new Date(user.nextLoginAttemptAt);
      displayTime.setMinutes(displayTime.getMinutes() + 1);

      return res.status(403).send({
        ok: false,
        code:
          "Trop de tentatives de connexions infructueuses, vous pourrez vous reconnecter à partir de " +
          displayTime.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", timeStyle: "short" }),
      });
    }
    const { password: expectedPassword } = await User.scope("withPassword").findOne({ where: { email }, attributes: ["password"] });

    const match = await comparePassword(password, expectedPassword);
    if (!match) {
      const loginAttempts = (user.loginAttempts || 0) + 1;

      let date = now;
      // Au quatrième essai, on est bloqué pour 1 minute
      if (loginAttempts > 3) {
        date = new Date(now.getTime() + 60 * 1000); // 1 minute
      }
      // Au septième essai, on est bloqué pour 1 heure
      if (loginAttempts > 6) {
        date = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
      }

      user.loginAttempts = loginAttempts;
      user.nextLoginAttemptAt = date;
      await user.save();
      return res.status(403).send({ ok: false, error: "E-mail ou mot de passe incorrect", code: EMAIL_OR_PASSWORD_INVALID });
    }

    user.lastLoginAt = new Date();
    user.nextLoginAttemptAt = null;
    user.loginAttempts = 0;

    createUserLog(req, user);

    await user.save();

    if (req.headers.platform === "android" && ["stats-only", "restricted-access"].includes(user.role)) {
      return res.status(403).send({ ok: false, error: "Accès interdit au personnel non habilité" });
    }

    const organisation = await user.getOrganisation();
    const orgTeams = await Team.findAll({ where: { organisation: organisation._id } });
    const userTeams = await RelUserTeam.findAll({ where: { user: user._id, team: { [Op.in]: orgTeams.map((t) => t._id) } } });
    const teams = userTeams.map((rel) => orgTeams.find((t) => t._id === rel.team));

    const token = jwt.sign({ _id: user._id }, config.SECRET, { expiresIn: JWT_MAX_AGE });
    res.cookie("jwt", token, cookieOptions());

    return res.status(200).send({ ok: true, token, user: serializeUserWithTeamsAndOrganisation(user, teams, organisation, orgTeams) });
  })
);

router.get(
  "/signin-token",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "superadmin", "restricted-access", "stats-only"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        cookies: z.object({
          jwt: z.optional(z.string().regex(jwtRegex)),
        }),
        headers: z.object({
          auth: z.optional(z.string().regex(headerJwtRegex)),
          platform: z.enum(["android", "dashboard"]),
        }),
      }).parse(req);
    } catch (e) {
      const error = new Error(`Invalid request in signin token: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { platform } = req.headers;

    const token = platform === "dashboard" ? req.cookies.jwt : platform === "android" ? ExtractJwt.fromAuthHeaderWithScheme("JWT")(req) : null;
    if (!token) return res.status(400).send({ ok: false });
    const user = await User.findOne({ where: { _id: req.user._id } });

    if (user.loginAttempts > 12 || user.decryptAttempts > 12) {
      return res.status(403).send({ ok: false, error: "Trop de tentatives de connexions infructueuses, le compte n'est plus accessible" });
    }

    const now = new Date();
    if (user.nextLoginAttemptAt && user.nextLoginAttemptAt > now) {
      const displayTime = new Date(user.nextLoginAttemptAt);
      displayTime.setMinutes(displayTime.getMinutes() + 1);

      return res.status(403).send({
        ok: false,
        code:
          "Trop de tentatives de connexions infructueuses, vous pourrez vous reconnecter à partir de " +
          displayTime.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", timeStyle: "short" }),
      });
    }

    const organisation = await user.getOrganisation();
    const orgTeams = await Team.findAll({ where: { organisation: organisation._id } });
    const userTeams = await RelUserTeam.findAll({ where: { user: user._id, team: { [Op.in]: orgTeams.map((t) => t._id) } } });
    const teams = userTeams.map((rel) => orgTeams.find((t) => t._id === rel.team));

    createUserLog(req, user);

    return res.status(200).send({ ok: true, token, user: serializeUserWithTeamsAndOrganisation(user, teams, organisation, orgTeams) });
  })
);

router.post(
  "/forgot_password",
  catchErrors(async (req, res, next) => {
    const {
      body: { email },
    } = req;
    try {
      z.string()
        .email()
        .parse((email || "").trim().toLowerCase());
    } catch (e) {
      const error = new Error(`Invalid request in forget password: ${e}`);
      error.status = 400;
      return next(error);
    }

    UserLog.create({
      platform: req.headers.platform === "android" ? "app" : req.headers.platform === "dashboard" ? "dashboard" : "unknown",
      action: `forgot-password-${email}`,
    });

    if (!email) return res.status(403).send({ ok: false, error: "Veuillez fournir un email", code: EMAIL_OR_PASSWORD_INVALID });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(200).send({ ok: true });

    const { password } = await User.scope("withPassword").findOne({ where: { email }, attributes: ["password"] });
    if (!password) return res.status(200).send({ ok: true });

    const token = crypto.randomBytes(20).toString("hex");
    user.forgotPasswordResetToken = token;
    user.forgotPasswordResetExpires = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000); // 30 days

    let link = `https://espace-mano.sesan.fr/auth/reset?token=${token}`;
    if (!user.name) link += `&newUser=true`;
    await user.save();

    const subject = "Réinitialiser votre mot de passe";
    const body = `Une requête pour réinitialiser votre mot de passe a été effectuée.
Si elle ne vient pas de vous, veuillez avertir l'administrateur.
Si vous en êtes à l'origine, vous pouvez cliquer sur ce lien: ${link}`;
    await mailservice.sendEmail(user.email, subject, body);

    return res.status(200).send({ ok: true });
  })
);

router.post(
  "/forgot_password_reset",
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        name: z.string().optional(),
        token: z.string().min(1),
        password: z.string().min(1),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in forget password reset: ${e}`);
      error.status = 400;
      return next(error);
    }
    const {
      body: { token, password, name },
    } = req;

    if (!validatePassword(password)) {
      return res.status(400).send({ ok: false, error: passwordCheckError, code: PASSWORD_NOT_VALIDATED });
    }
    const user = await User.findOne({ where: { forgotPasswordResetToken: token, forgotPasswordResetExpires: { [Op.gte]: new Date() } } });

    if (!user) {
      UserLog.create({
        platform: req.headers.platform === "android" ? "app" : req.headers.platform === "dashboard" ? "dashboard" : "unknown",
        action: `forgot-password-reset-failed-${token}`,
      });
      return res.status(400).send({ ok: false, error: "Le lien est non valide ou expiré" });
    }
    UserLog.create({
      organisation: user.organisation,
      user: user.id,
      platform: req.headers.platform === "android" ? "app" : req.headers.platform === "dashboard" ? "dashboard" : "unknown",
      action: "forgot-password-reset",
    });
    user.set({
      password: password,
      forgotPasswordResetToken: null,
      forgotPasswordResetExpires: null,
      lastChangePasswordAt: Date.now(),
    });
    if (name) user.set({ name: sanitizeAll(name) });
    await user.save();
    return res.status(200).send({ ok: true });
  })
);

router.post(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["superadmin", "admin"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        name: z.string().optional(),
        phone: z.string().optional(),
        email: z.preprocess((email) => email.trim().toLowerCase(), z.string().email().optional().or(z.literal(""))),
        healthcareProfessional: z.boolean(),
        team: z.array(z.string().regex(looseUuidRegex)),
        role: z.enum(["admin", "normal", "restricted-access", "stats-only"]),
        ...(req.user.role === "superadmin" ? { organisation: z.string().regex(looseUuidRegex) } : {}),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in user creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisationId = req.user.role === "superadmin" ? req.body.organisation : req.user.organisation;
    const { name, email, role, team, healthcareProfessional, phone } = req.body;
    const token = crypto.randomBytes(20).toString("hex");
    const newUser = {
      name: sanitizeAll(name),
      phone: sanitizeAll(phone) || null,
      role,
      healthcareProfessional: ["stats-only", "restricted-access"].includes(role) ? false : healthcareProfessional,
      email: sanitizeAll(email.trim().toLowerCase()),
      password: crypto.randomBytes(60).toString("hex"), // A useless password.
      organisation: organisationId,
      forgotPasswordResetToken: token,
      forgotPasswordResetExpires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 days
    };

    UserLog.create({
      organisation: organisationId,
      user: req.user.id,
      platform: req.headers.platform === "android" ? "app" : req.headers.platform === "dashboard" ? "dashboard" : "unknown",
      action: `create-user-${sanitizeAll(email.trim().toLowerCase())}`,
    });

    const prevUser = await User.findOne({ where: { email: newUser.email } });
    if (prevUser) return res.status(400).send({ ok: false, error: "Un utilisateur existe déjà avec cet email" });

    const data = await User.create(newUser, { returning: true });

    const user = await User.findOne({ where: { _id: data._id } });
    const teams = await Team.findAll({ where: { organisation: organisationId, _id: { [Op.in]: team } } });
    const tx = await User.sequelize.transaction();
    await RelUserTeam.bulkCreate(
      teams.map((t) => ({ user: data._id, team: t._id, organisation: organisationId })),
      { transaction: tx }
    );
    await tx.commit();
    await user.save({ transaction: tx });

    const organisation = await Organisation.findOne({ where: { _id: organisationId } });
    await mailservice.sendEmail(data.email, "Bienvenue dans Mano", null, mailBienvenueHtml(data.name, data.email, organisation.name, token));

    return res.status(200).send({
      ok: true,
      data: {
        _id: data._id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        role: data.role,
        healthcareProfessional: data.healthcareProfessional,
        organisation: data.organisation,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  })
);

router.post(
  "/reset_password",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "superadmin", "restricted-access", "stats-only"]),
  catchErrors(async (req, res, next) => {
    try {
      z.string().min(1).parse(req.body.password);
      z.string().min(1).parse(req.body.newPassword);
      z.string().min(1).parse(req.body.verifyPassword);
      z.object({
        password: z.string().min(1),
        newPassword: z.string().min(1),
        verifyPassword: z.string().min(1),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in reset password: ${e}`);
      error.status = 400;
      return next(error);
    }
    const _id = req.user._id;
    const { password, newPassword, verifyPassword } = req.body;

    if (newPassword !== verifyPassword) return res.status(400).send({ ok: false, error: "Les mots de passe ne sont pas identiques" });
    if (!validatePassword(newPassword)) return res.status(400).send({ ok: false, error: passwordCheckError, code: PASSWORD_NOT_VALIDATED });

    const user = await User.findOne({ where: { _id } });

    const { password: expectedPassword } = await User.scope("withPassword").findOne({ where: { _id }, attributes: ["password"] });

    const auth = await comparePassword(password, expectedPassword);
    if (!auth) return res.status(403).send({ ok: false, error: "Mot de passe incorrect", code: "Mot de passe incorrect" });

    user.set({
      password: newPassword,
      lastChangePasswordAt: Date.now(),
    });
    await user.save();

    const userWithoutPassword = await User.findOne({ where: { _id } });

    return res.status(200).send({
      ok: true,
      user: {
        _id: userWithoutPassword._id,
        name: userWithoutPassword.name,
        phone: userWithoutPassword.phone,
        email: userWithoutPassword.email,
        createdAt: userWithoutPassword.createdAt,
        updatedAt: userWithoutPassword.updatedAt,
        role: userWithoutPassword.role,
        healthcareProfessional: userWithoutPassword.healthcareProfessional,
        lastChangePasswordAt: userWithoutPassword.lastChangePasswordAt,
        termsAccepted: userWithoutPassword.termsAccepted,
        cgusAccepted: userWithoutPassword.cgusAccepted,
        gaveFeedbackEarly2023: userWithoutPassword.gaveFeedbackEarly2023,
      },
    });
  })
);

router.post(
  "/decrypt-attempt-failure",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "superadmin", "restricted-access", "stats-only"]),
  catchErrors(async (req, res) => {
    const _id = req.user._id;
    const user = await User.findOne({ where: { _id } });

    const decryptAttempts = (user.decryptAttempts || 0) + 1;

    user.decryptAttempts = decryptAttempts;
    await user.save();
    UserLog.create({
      user: user._id,
      organisation: user.organisation,
      platform: "unknown",
      action: "decrypt-attempt-failure",
    });
    return res.status(200).send({ ok: false, error: "" });
  })
);

router.post(
  "/decrypt-attempt-success",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "superadmin", "restricted-access", "stats-only"]),
  catchErrors(async (req, res) => {
    const _id = req.user._id;
    const user = await User.findOne({ where: { _id } });
    user.decryptAttempts = 0;
    await user.save();
    UserLog.create({
      user: user._id,
      organisation: user.organisation,
      platform: "unknown",
      action: "decrypt-attempt-success",
    });
    return res.status(200).send({ ok: true });
  })
);

router.get(
  "/search",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["superadmin"]),
  catchErrors(async (req, res) => {
    const search = req.query.search || "";
    const users = await User.findAll({
      where: {
        [Op.or]: [{ name: { [Op.iLike]: `%${search}%` } }, { email: { [Op.iLike]: `%${search}%` } }],
      },
      include: [
        { model: Team, as: "Teams" },
        { model: Organisation, as: "Organisation", attributes: ["_id", "name"] },
      ],
    });

    const data = users.map((user) => {
      return {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        healthcareProfessional: user.healthcareProfessional,
        lastChangePasswordAt: user.lastChangePasswordAt,
        termsAccepted: user.termsAccepted,
        cgusAccepted: user.cgusAccepted,
        gaveFeedbackEarly2023: user.gaveFeedbackEarly2023,
        lastLoginAt: user.lastLoginAt,
        decryptAttempts: user.decryptAttempts,
        teams: user.Teams ? user.Teams.map(serializeTeam) : [],
        organisationPopulated: user.Organisation,
      };
    });

    return res.status(200).send({
      ok: true,
      data,
    });
  })
);

router.get(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in get user by id: ${e}`);
      error.status = 400;
      return next(error);
    }

    const query = { where: { _id: req.params._id } };
    query.where.organisation = req.user.organisation;
    const user = await User.findOne(query);
    const team = await user.getTeams({ raw: true, attributes: ["_id"] });
    return res.status(200).send({
      ok: true,
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        healthcareProfessional: user.healthcareProfessional,
        lastChangePasswordAt: user.lastChangePasswordAt,
        termsAccepted: user.termsAccepted,
        cgusAccepted: user.cgusAccepted,
        gaveFeedbackEarly2023: user.gaveFeedbackEarly2023,
        team: team.map((t) => t._id),
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "superadmin", "restricted-access", "stats-only"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        minimal: z.optional(z.literal("true")),
        ...(req.user.role === "superadmin" ? { organisation: z.optional(z.string().regex(looseUuidRegex)) } : {}),
      }).parse(req.query);
    } catch (e) {
      const error = new Error(`Invalid request in get users: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisationId = req.user.role === "superadmin" && req.query.organisation ? req.query.organisation : req.user.organisation;

    const includeTeams = (req.user.role === "admin" || req.user.role === "superadmin") && req.query.minimal !== "true";

    const users = await User.findAll({
      where: { organisation: organisationId },
      include: includeTeams ? [{ model: Team, as: "Teams" }] : [],
    });

    const data = users.map((user) => {
      if ((req.user.role !== "admin" && req.user.role !== "superadmin") || req.query.minimal === "true") {
        return {
          name: user.name,
          _id: user._id,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          decryptAttempts: user.decryptAttempts,
        };
      }

      return {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        healthcareProfessional: user.healthcareProfessional,
        lastChangePasswordAt: user.lastChangePasswordAt,
        termsAccepted: user.termsAccepted,
        cgusAccepted: user.cgusAccepted,
        gaveFeedbackEarly2023: user.gaveFeedbackEarly2023,
        lastLoginAt: user.lastLoginAt,
        decryptAttempts: user.decryptAttempts,
        teams: user.Teams ? user.Teams.map(serializeTeam) : [],
      };
    });

    return res.status(200).send({ ok: true, data });
  })
);

router.put(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "superadmin", "restricted-access", "stats-only"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        name: z.optional(z.string().min(1)),
        phone: z.string().optional(),
        email: z.preprocess((email) => email.trim().toLowerCase(), z.string().email().optional().or(z.literal(""))),
        password: z.optional(z.string().min(1)),
        gaveFeedbackEarly2023: z.optional(z.boolean()),
        team: z.optional(z.array(z.string().regex(looseUuidRegex))),
        ...(req.body.termsAccepted ? { termsAccepted: z.preprocess((input) => new Date(input), z.date()) } : {}),
        ...(req.body.cgusAccepted ? { cgusAccepted: z.preprocess((input) => new Date(input), z.date()) } : {}),
      });
    } catch (e) {
      const error = new Error(`Invalid request in put user by id: ${e}`);
      error.status = 400;
      return next(error);
    }

    const _id = req.user._id;
    const { name, email, password, team, termsAccepted, cgusAccepted, gaveFeedbackEarly2023, phone } = req.body;

    const user = await User.findOne({ where: { _id } });
    if (!user) return res.status(404).send({ ok: false, error: "Utilisateur non trouvé" });

    if (name) user.set({ name: sanitizeAll(name) });
    if (phone) user.set({ phone: sanitizeAll(phone) });
    if (email) {
      const newEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ where: { email: newEmail, _id: { [Op.ne]: _id } } });
      if (existingUser) return res.status(400).send({ ok: false, error: "Un utilisateur existe déjà avec cet email" });
      user.set({ email: newEmail });
    }
    if (termsAccepted) user.set({ termsAccepted: termsAccepted });
    if (cgusAccepted) user.set({ cgusAccepted: cgusAccepted });
    if (password) {
      if (!validatePassword(password)) return res.status(400).send({ ok: false, error: passwordCheckError, code: PASSWORD_NOT_VALIDATED });
      user.set({ password: password });
    }

    if (gaveFeedbackEarly2023) user.set({ gaveFeedbackEarly2023 });

    const tx = await User.sequelize.transaction();
    if (team && Array.isArray(team)) {
      const existingTeams = await Team.findAll({
        where: {
          organisation: user.organisation,
          _id: { [Op.in]: team },
        },
        transaction: tx,
      });
      await RelUserTeam.destroy({ where: { user: _id }, transaction: tx });
      await RelUserTeam.bulkCreate(
        existingTeams.map((team) => ({ user: _id, team: team._id, organisation: user.organisation })),
        { transaction: tx }
      );
    }
    await user.save({ transaction: tx });
    await tx.commit();

    return res.status(200).send({
      ok: true,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        healthcareProfessional: user.healthcareProfessional,
        lastChangePasswordAt: user.lastChangePasswordAt,
        termsAccepted: user.termsAccepted,
        cgusAccepted: user.cgusAccepted,
        gaveFeedbackEarly2023: user.gaveFeedbackEarly2023,
      },
    });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        params: z.object({
          _id: z.string().regex(looseUuidRegex),
        }),
        body: z.object({
          name: z.optional(z.string().min(1)),
          phone: z.string().optional(),
          email: z.optional(z.preprocess((email) => email.trim().toLowerCase(), z.string().email().optional().or(z.literal("")))),
          password: z.optional(z.string().min(1)),
          team: z.optional(z.array(z.string().regex(looseUuidRegex))),
          healthcareProfessional: z.optional(z.boolean()),
        }),
      }).parse(req);
    } catch (e) {
      const error = new Error(`Invalid request in put user by id: ${e}`);
      error.status = 400;
      return next(error);
    }

    const _id = req.params._id;
    const { name, email, team, role, healthcareProfessional, phone } = req.body;

    const user = await User.findOne({ where: { _id, organisation: req.user.organisation } });
    if (!user) return res.status(404).send({ ok: false, error: "Not Found" });

    if (name) user.name = sanitizeAll(name);
    if (phone) user.phone = sanitizeAll(phone);
    if (email) {
      const newEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({ where: { email: newEmail, _id: { [Op.ne]: _id } } });
      if (existingUser) return res.status(400).send({ ok: false, error: "Un utilisateur existe déjà avec cet email" });
      user.email = sanitizeAll(email.trim().toLowerCase());
    }

    if (healthcareProfessional !== undefined) user.set({ healthcareProfessional });
    if (role) user.set({ role });
    if (["stats-only", "restricted-access"].includes(user.role)) {
      user.set({ healthcareProfessional: false });
    }
    const tx = await User.sequelize.transaction();
    if (team && Array.isArray(team)) {
      const existingTeams = await Team.findAll({
        where: {
          organisation: req.user.organisation,
          _id: { [Op.in]: team },
        },
        transaction: tx,
      });
      await RelUserTeam.destroy({ where: { user: _id }, transaction: tx });
      await RelUserTeam.bulkCreate(
        existingTeams.map((team) => ({ user: _id, team: team._id, organisation: user.organisation })),
        { transaction: tx }
      );
    }

    await user.save({ transaction: tx });
    await tx.commit();

    return res.status(200).send({
      ok: true,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        healthcareProfessional: user.healthcareProfessional,
        lastChangePasswordAt: user.lastChangePasswordAt,
        termsAccepted: user.termsAccepted,
        cgusAccepted: user.cgusAccepted,
        gaveFeedbackEarly2023: user.gaveFeedbackEarly2023,
      },
    });
  })
);

router.delete(
  "/me",
  passport.authenticate("user", { session: false, failWithError: true }),
  catchErrors(async (req, res) => {
    const userId = req.user._id;

    UserLog.create({
      organisation: req.user.organisation,
      user: req.user._id,
      platform: req.headers.platform === "android" ? "app" : req.headers.platform === "dashboard" ? "dashboard" : "unknown",
      action: `delete-me`,
    });

    const query = { where: { _id: userId, organisation: req.user.organisation } };

    let user = await User.findOne(query);
    if (!user) return res.status(404).send({ ok: false, error: "Not Found" });

    let tx = await User.sequelize.transaction();
    await Promise.all([User.destroy({ ...query, transaction: tx }), RelUserTeam.destroy({ where: { user: userId }, transaction: tx })]);
    await user.destroy({ transaction: tx });
    await tx.commit();
    res.status(200).send({ ok: true });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "superadmin"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in delete user by id: ${e}`);
      error.status = 400;
      return next(error);
    }

    const userId = req.params._id;

    UserLog.create({
      organisation: req.user.organisation,
      user: req.user._id,
      platform: req.headers.platform === "android" ? "app" : req.headers.platform === "dashboard" ? "dashboard" : "unknown",
      action: `delete-user-${userId}`,
    });

    const query = { where: { _id: userId } };
    if (req.user.role !== "superadmin") query.where.organisation = req.user.organisation;

    let user = await User.findOne(query);
    if (!user) return res.status(404).send({ ok: false, error: "Not Found" });

    let tx = await User.sequelize.transaction();
    await Promise.all([User.destroy({ ...query, transaction: tx }), RelUserTeam.destroy({ where: { user: userId }, transaction: tx })]);
    await user.destroy({ transaction: tx });
    await tx.commit();
    res.status(200).send({ ok: true });
  })
);

router.post(
  "/generate-link",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["superadmin"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in generate token: ${e}`);
      error.status = 400;
      return next(error);
    }

    const _id = req.body._id;
    const user = await User.findOne({ where: { _id } });
    if (!user) return res.status(404).send({ ok: false, error: "Not Found" });

    const token = crypto.randomBytes(20).toString("hex");
    user.forgotPasswordResetToken = token;
    user.forgotPasswordResetExpires = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000); // 30 days
    let link = `https://espace-mano.sesan.fr/auth/reset?token=${token}`;
    if (!user.name) link += `&newUser=true`;
    await user.save();

    return res.status(200).send({ ok: true, data: { link } });
  })
);

module.exports = router;
