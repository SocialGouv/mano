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
const User = require("../models/user");
const RelUserTeam = require("../models/relUserTeam");
const Team = require("../models/team");
const validateUser = require("../middleware/validateUser");
const { capture } = require("../sentry");
const { ExtractJwt } = require("passport-jwt");

const EMAIL_OR_PASSWORD_INVALID = "EMAIL_OR_PASSWORD_INVALID";
const PASSWORD_NOT_VALIDATED = "PASSWORD_NOT_VALIDATED";

const passwordCheckError =
  "Le mot de passe n'est pas valide. Il doit comprendre 6 caractères, au moins une lettre, un chiffre et un caractère spécial";

const JWT_MAX_AGE = 60 * 60 * 3; // 3 hours in s
const COOKIE_MAX_AGE = JWT_MAX_AGE * 1000;

function cookieOptions() {
  if (config.ENVIRONMENT === "development" || config.ENVIRONMENT === "test") {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, sameSite: "None" };
  } else {
    return { maxAge: COOKIE_MAX_AGE, httpOnly: true, secure: true, domain: ".fabrique.social.gouv.fr", sameSite: "Lax" };
  }
}

function logoutCookieOptions() {
  if (config.ENVIRONMENT === "development" || config.ENVIRONMENT === "test") {
    return { httpOnly: true, secure: true, sameSite: "None" };
  } else {
    return { httpOnly: true, secure: true, domain: ".fabrique.social.gouv.fr", sameSite: "Lax" };
  }
}

function updateUserDebugInfos(req, user) {
  if (req.headers.platform === "android") {
    try {
      z.optional(z.number()).parse(req.body.apilevel);
      z.optional(z.string()).parse(req.body.brand);
      z.optional(z.string()).parse(req.body.carrier);
      z.optional(z.string()).parse(req.body.device);
      z.optional(z.string()).parse(req.body.deviceid);
      z.optional(z.number()).parse(req.body.freediskstorage);
      z.optional(z.string()).parse(req.body.hardware);
      z.optional(z.string()).parse(req.body.manufacturer);
      z.optional(z.number()).parse(req.body.maxmemory);
      z.optional(z.string()).parse(req.body.model);
      z.optional(z.string()).parse(req.body.product);
      z.optional(z.string()).parse(req.body.readableversion);
      z.optional(z.string()).parse(req.body.systemname);
      z.optional(z.string()).parse(req.body.systemversion);
      z.optional(z.string()).parse(req.body.buildid);
      z.optional(z.number()).parse(req.body.totaldiskcapacity);
      z.optional(z.number()).parse(req.body.totalmemory);
      z.optional(z.string()).parse(req.body.useragent);
      z.optional(z.boolean()).parse(req.body.tablet);
    } catch (e) {
      capture(e, { extra: { body: req.body }, user });
      return;
    }
    user.debugApp = {
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
    };
  }
  if (req.headers.platform === "dashboard") {
    try {
      z.optional(z.string()).parse(req.body.browsertype);
      z.optional(z.string()).parse(req.body.browsername);
      z.optional(z.string()).parse(req.body.browserversion);
      z.optional(z.string()).parse(req.body.browseros);
      z.optional(z.string()).parse(req.headers.version);
    } catch (e) {
      capture(e, { extra: { body: req.body }, user });
      return;
    }
    user.debugDashboard = {
      browserType: req.body.browsertype,
      browserName: req.body.browsername,
      browserVersion: req.body.browserversion,
      browserOs: req.body.browseros,
      version: req.headers.version,
    };
  }
}

function serializeUserWithTeamsAndOrganisation(user, teams, organisation) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.role,
    healthcareProfessional: user.healthcareProfessional,
    lastChangePasswordAt: user.lastChangePasswordAt,
    termsAccepted: user.termsAccepted,
    teams: teams.map((t) => ({
      _id: t._id,
      name: t.name,
      organisation: t.organisation,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      nightSession: t.nightSession,
    })),
    organisation: {
      _id: organisation._id,
      name: organisation.name,
      createdAt: organisation.createdAt,
      updatedAt: organisation.updatedAt,
      categories: organisation.categories,
      consultations: organisation.consultations,
      encryptionEnabled: organisation.encryptionEnabled,
      encryptionLastUpdateAt: organisation.encryptionLastUpdateAt,
      receptionEnabled: organisation.receptionEnabled,
      services: organisation.services,
      collaborations: organisation.collaborations,
      customFieldsObs: organisation.customFieldsObs,
      encryptedVerificationKey: organisation.encryptedVerificationKey,
      customFieldsPersonsSocial: organisation.customFieldsPersonsSocial,
      customFieldsPersonsMedical: organisation.customFieldsPersonsMedical,
      customFieldsMedicalFile: organisation.customFieldsMedicalFile,
      migrations: organisation.migrations,
      migrationLastUpdateAt: organisation.migrationLastUpdateAt,
    },
  };
}

router.get(
  "/me",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "superadmin", "non-professional"]),
  catchErrors(async (req, res) => {
    const user = await User.findOne({ where: { _id: req.user._id } });
    const teams = await user.getTeams();
    const organisation = await user.getOrganisation();
    return res.status(200).send({
      ok: true,
      user: serializeUserWithTeamsAndOrganisation(user, teams, organisation),
    });
  })
);

router.post(
  "/logout",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "superadmin", "non-professional"]),
  catchErrors(async (_req, res) => {
    res.clearCookie("jwt", logoutCookieOptions());
    return res.status(200).send({ ok: true });
  })
);

router.post(
  "/signin",
  catchErrors(async (req, res, next) => {
    try {
      z.string().parse(req.body.password);
      z.string()
        .email()
        .parse((req.body.email || "").trim().toLowerCase());
    } catch (e) {
      const error = new Error(`Invalid request in signin: ${e}`);
      error.status = 400;
      return next(error);
    }

    let { password, email } = req.body;
    if (!password || !email) return res.status(400).send({ ok: false, error: "Missing password" });
    email = (email || "").trim().toLowerCase();

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(403).send({ ok: false, error: "E-mail ou mot de passe incorrect", code: EMAIL_OR_PASSWORD_INVALID });

    const { password: expectedPassword } = await User.scope("withPassword").findOne({ where: { email }, attributes: ["password"] });

    const match = await comparePassword(password, expectedPassword);
    if (!match) return res.status(403).send({ ok: false, error: "E-mail ou mot de passe incorrect", code: EMAIL_OR_PASSWORD_INVALID });
    user.lastLoginAt = new Date();

    updateUserDebugInfos(req, user);

    await user.save();
    // non-professional users cannot acces the app
    if (req.headers.platform === "android" && user.role === "non-professional") {
      return res.status(403).send({ ok: false, error: "Accès interdit au personnel non habilité" });
    }

    const organisation = await user.getOrganisation();
    const orgTeams = await Team.findAll({ where: { organisation: organisation._id } });
    const userTeams = await RelUserTeam.findAll({ where: { user: user._id, team: { [Op.in]: orgTeams.map((t) => t._id) } } });
    const teams = userTeams.map((rel) => orgTeams.find((t) => t._id === rel.team));

    const token = jwt.sign({ _id: user._id }, config.SECRET, { expiresIn: JWT_MAX_AGE });
    res.cookie("jwt", token, cookieOptions());

    return res.status(200).send({ ok: true, token, user: serializeUserWithTeamsAndOrganisation(user, teams, organisation) });
  })
);

router.get(
  "/signin-token",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "superadmin", "non-professional"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string().regex(jwtRegex)).parse(req.cookies.jwt);
      z.optional(z.string().regex(headerJwtRegex)).parse(req.headers.auth);
      z.enum(["android", "dashboard"]).parse(req.headers.platform);
    } catch (e) {
      const error = new Error(`Invalid request in signin token: ${e}`);
      error.status = 400;
      return next(error);
    }

    const { platform } = req.headers;

    const token = platform === "dashboard" ? req.cookies.jwt : platform === "android" ? ExtractJwt.fromAuthHeaderWithScheme("JWT")(req) : null;
    if (!token) return res.status(400).send({ ok: false });
    const user = await User.findOne({ where: { _id: req.user._id } });

    const organisation = await user.getOrganisation();
    const orgTeams = await Team.findAll({ where: { organisation: organisation._id } });
    const userTeams = await RelUserTeam.findAll({ where: { user: user._id, team: { [Op.in]: orgTeams.map((t) => t._id) } } });
    const teams = userTeams.map((rel) => orgTeams.find((t) => t._id === rel.team));

    return res.status(200).send({ ok: true, token, user: serializeUserWithTeamsAndOrganisation(user, teams, organisation) });
  })
);

router.post(
  "/forgot_password",
  catchErrors(async ({ body: { email } }, res) => {
    try {
      z.string()
        .email()
        .parse((email || "").trim().toLowerCase());
    } catch (e) {
      const error = new Error(`Invalid request in forget password: ${e}`);
      error.status = 400;
      return next(error);
    }

    if (!email) return res.status(403).send({ ok: false, error: "Veuillez fournir un email", code: EMAIL_OR_PASSWORD_INVALID });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(200).send({ ok: true });

    const { password } = await User.scope("withPassword").findOne({ where: { email }, attributes: ["password"] });
    if (!password) return res.status(200).send({ ok: true });

    const token = crypto.randomBytes(20).toString("hex");
    user.forgotPasswordResetToken = token;
    user.forgotPasswordResetExpires = new Date(Date.now() + JWT_MAX_AGE * 1000);

    const link = `https://dashboard-mano.fabrique.social.gouv.fr/auth/reset?token=${token}`;

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
  catchErrors(async ({ body: { token, password } }, res) => {
    try {
      z.string().min(1).parse(token);
      z.string().min(1).parse(password);
    } catch (e) {
      const error = new Error(`Invalid request in forget password reset: ${e}`);
      error.status = 400;
      return next(error);
    }

    if (!validatePassword(password)) return res.status(400).send({ ok: false, error: passwordCheckError, code: PASSWORD_NOT_VALIDATED });
    const user = await User.findOne({ where: { forgotPasswordResetToken: token, forgotPasswordResetExpires: { [Op.gte]: new Date() } } });

    if (!user) return res.status(400).send({ ok: false, error: "Le lien est non valide ou expiré" });
    user.set({
      password: password,
      forgotPasswordResetToken: null,
      forgotPasswordResetExpires: null,
      lastChangePasswordAt: Date.now(),
    });
    await user.save();
    return res.status(200).send({ ok: true });
  })
);

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.string().min(1).parse(req.body.name);
      z.string().email().parse(req.body.email);
      z.boolean().parse(req.body.healthcareProfessional);
      z.array(z.string().regex(looseUuidRegex)).parse(req.body.team);
      z.enum(["admin", "normal", "non-professional"]).parse(req.body.role);
    } catch (e) {
      const error = new Error(`Invalid request in user creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const { name, email, role, team, healthcareProfessional } = req.body;
    const token = crypto.randomBytes(20).toString("hex");
    const newUser = {
      name: sanitizeAll(name),
      role,
      healthcareProfessional,
      email: sanitizeAll(email.trim().toLowerCase()),
      password: crypto.randomBytes(60).toString("hex"), // A useless password.
      organisation: req.user.organisation,
      forgotPasswordResetToken: token,
      forgotPasswordResetExpires: new Date(Date.now() + JWT_MAX_AGE * 1000),
    };

    const prevUser = await User.findOne({ where: { email: newUser.email } });
    if (prevUser) return res.status(400).send({ ok: false, error: "A user already exists with this email" });

    const data = await User.create(newUser, { returning: true });

    const user = await User.findOne({ where: { _id: data._id } });
    const teams = await Team.findAll({ where: { organisation: req.user.organisation, _id: { [Op.in]: team } } });
    const tx = await User.sequelize.transaction();
    await RelUserTeam.bulkCreate(
      teams.map((t) => ({ user: data._id, team: t._id })),
      { transaction: tx }
    );
    await tx.commit();
    await user.save({ transaction: tx });

    const subject = "Bienvenue dans Mano 👋";
    const body = `Bonjour ${data.name} !

Votre identifiant pour vous connecter à Mano est ${data.email}.
Vous pouvez dès à présent vous connecter pour choisir votre mot de passe ici:
https://dashboard-mano.fabrique.social.gouv.fr/auth/reset?token=${token}

Vous pourrez ensuite commencer à utiliser Mano en suivant ce lien:
https://dashboard-mano.fabrique.social.gouv.fr/

Toute l'équipe Mano vous souhaite la bienvenue !

Si vous avez des questions n'hésitez pas à nous contacter:

Nathan Fradin, chargé de déploiement: nathan.fradin.mano@gmail.com - +33 6 29 54 94 26
Guillaume Demirhan, porteur du projet: g.demirhan@aurore.asso.fr - +33 7 66 56 19 96
`;
    await mailservice.sendEmail(data.email, subject, body);

    return res.status(200).send({
      ok: true,
      data: {
        _id: data._id,
        name: data.name,
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
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "superadmin", "non-professional"]),
  catchErrors(async (req, res, next) => {
    try {
      z.string().min(1).parse(req.body.password);
      z.string().min(1).parse(req.body.newPassword);
      z.string().min(1).parse(req.body.verifyPassword);
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
        email: userWithoutPassword.email,
        createdAt: userWithoutPassword.createdAt,
        updatedAt: userWithoutPassword.updatedAt,
        role: userWithoutPassword.role,
        healthcareProfessional: userWithoutPassword.healthcareProfessional,
        lastChangePasswordAt: userWithoutPassword.lastChangePasswordAt,
        termsAccepted: userWithoutPassword.termsAccepted,
      },
    });
  })
);

router.get(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
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
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        healthcareProfessional: user.healthcareProfessional,
        lastChangePasswordAt: user.lastChangePasswordAt,
        termsAccepted: user.termsAccepted,
        team: team.map((t) => t._id),
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "superadmin", "non-professional"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.literal("true")).parse(req.query.minimal);
    } catch (e) {
      const error = new Error(`Invalid request in get users: ${e}`);
      error.status = 400;
      return next(error);
    }

    const users = await User.findAll({ where: { organisation: req.user.organisation } });
    const data = [];

    if (req.user.role !== "admin" || req.query.minimal === "true") {
      for (let user of users) {
        data.push({ name: user.name, _id: user._id });
      }
      return res.status(200).send({ ok: true, data });
    }

    for (let user of users) {
      const teams = await user.getTeams();
      data.push({
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        healthcareProfessional: user.healthcareProfessional,
        lastChangePasswordAt: user.lastChangePasswordAt,
        termsAccepted: user.termsAccepted,
        lastLoginAt: user.lastLoginAt,
        teams: teams.map((t) => ({
          _id: t._id,
          name: t.name,
          organisation: t.organisation,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          nightSession: t.nightSession,
        })),
      });
    }
    return res.status(200).send({ ok: true, data });
  })
);

router.put(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "superadmin", "non-professional"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string().min(1)).parse(req.body.name);
      z.string()
        .email()
        .optional()
        .or(z.literal(""))
        .parse((req.body.email || "").trim().toLowerCase());
      z.optional(z.string().min(1)).parse(req.body.password);
      z.optional(z.array(z.string().regex(looseUuidRegex))).parse(req.body.team);
      if (req.body.termsAccepted) z.preprocess((input) => new Date(input), z.date()).parse(req.body.termsAccepted);
    } catch (e) {
      const error = new Error(`Invalid request in put user by id: ${e}`);
      error.status = 400;
      return next(error);
    }

    const _id = req.user._id;
    const { name, email, password, team, termsAccepted } = req.body;

    const user = await User.findOne({ where: { _id } });
    if (!user) return res.status(404).send({ ok: false, error: "Utilisateur non trouvé" });

    if (name) user.set({ name: sanitizeAll(name) });
    if (email) user.set({ email: sanitizeAll(email.trim().toLowerCase()) });
    if (termsAccepted) user.set({ termsAccepted: termsAccepted });
    if (password) {
      if (!validatePassword(password)) return res.status(400).send({ ok: false, error: passwordCheckError, code: PASSWORD_NOT_VALIDATED });
      user.set({ password: password });
    }

    const tx = await User.sequelize.transaction();
    if (team && Array.isArray(team)) {
      await RelUserTeam.destroy({ where: { user: _id }, transaction: tx });
      await RelUserTeam.bulkCreate(
        team.map((teamId) => ({ user: _id, team: teamId })),
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
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        healthcareProfessional: user.healthcareProfessional,
        lastChangePasswordAt: user.lastChangePasswordAt,
        termsAccepted: user.termsAccepted,
      },
    });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
      z.optional(z.string().min(1)).parse(req.body.name);

      z.string()
        .email()
        .optional()
        .or(z.literal(""))
        .parse((req.body.email || "").trim().toLowerCase());
      z.optional(z.array(z.string().regex(looseUuidRegex))).parse(req.body.team);
      z.optional(z.boolean()).parse(req.body.healthcareProfessional);
      z.optional(z.enum(["admin", "normal", "non-professional"])).parse(req.body.role);
    } catch (e) {
      const error = new Error(`Invalid request in put user by id: ${e}`);
      error.status = 400;
      return next(error);
    }

    const _id = req.params._id;
    const { name, email, team, role, healthcareProfessional } = req.body;

    const user = await User.findOne({ where: { _id, organisation: req.user.organisation } });
    if (!user) return res.status(404).send({ ok: false, error: "Not Found" });

    if (name) user.name = sanitizeAll(name);
    if (email) user.email = sanitizeAll(email.trim().toLowerCase());
    if (healthcareProfessional !== undefined) user.set({ healthcareProfessional });
    if (role) user.set({ role });

    const tx = await User.sequelize.transaction();
    if (team && Array.isArray(team)) {
      await RelUserTeam.destroy({ where: { user: _id }, transaction: tx });
      await RelUserTeam.bulkCreate(
        team.map((teamId) => ({ user: _id, team: teamId })),
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
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        healthcareProfessional: user.healthcareProfessional,
        lastChangePasswordAt: user.lastChangePasswordAt,
        termsAccepted: user.termsAccepted,
      },
    });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      const error = new Error(`Invalid request in delete user by id: ${e}`);
      error.status = 400;
      return next(error);
    }
    const userId = req.params._id;
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

module.exports = router;
