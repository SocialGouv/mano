const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op, fn } = require("sequelize");
const crypto = require("crypto");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const User = require("../models/user");
const Action = require("../models/action");
const Consultation = require("../models/consultation");
const Treatment = require("../models/treatment");
const MedicalFile = require("../models/medicalFile");
const Person = require("../models/person");
const Group = require("../models/group");
const Territory = require("../models/territory");
const Report = require("../models/report");
const Comment = require("../models/comment");
const Passage = require("../models/passage");
const Rencontre = require("../models/rencontre");
const mailservice = require("../utils/mailservice");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex, customFieldSchema, positiveIntegerRegex } = require("../utils");
const { capture } = require("../sentry");
const Place = require("../models/place");
const RelPersonPlace = require("../models/relPersonPlace");
const TerritoryObservation = require("../models/territoryObservation");
const { serializeOrganisation } = require("../utils/data-serializer");

const JWT_MAX_AGE = 60 * 60 * 3; // 3 hours in s

router.get(
  "/stats",
  passport.authenticate("user", { session: false }),
  validateUser(["superadmin", "admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        organisation: z.string().regex(looseUuidRegex),
        after: z.optional(z.string().regex(positiveIntegerRegex)),
        withAllMedicalData: z.optional(z.enum(["true", "false"])),
        withDeleted: z.optional(z.enum(["true", "false"])),
      }).parse(req.query);
    } catch (e) {
      const error = new Error(`Invalid request in stats get: ${e}`);
      error.status = 400;
      return next(error);
    }

    const query = { where: { organisation: req.query.organisation } };
    const { after, withDeleted, withAllMedicalData } = req.query;

    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const places = await Place.count(query);
    const relsPersonPlace = await RelPersonPlace.count(query);
    const actions = await Action.count(query);
    const persons = await Person.count(query);
    const groups = await Group.count(query);
    const comments = await Comment.count(query);
    const passages = await Passage.count(query);
    const rencontres = await Rencontre.count(query);
    const reports = await Report.count(query);
    const territoryObservations = await TerritoryObservation.count(query);
    const territories = await Territory.count(query);

    // Medical data is never saved in cache so we always have to download all at every page reload.
    // In other words "after" param is intentionnaly ignored for consultations, treatments and medical files.
    const medicalDataQuery =
      withAllMedicalData !== "true" ? query : { where: { organisation: req.query.organisation }, paranoid: withDeleted === "true" };
    const consultations = await Consultation.count(medicalDataQuery);
    const medicalFiles = await MedicalFile.count(medicalDataQuery);
    const treatments = await Treatment.count(medicalDataQuery);

    return res.status(200).send({
      ok: true,
      data: {
        actions,
        consultations,
        treatments,
        comments,
        passages,
        rencontres,
        medicalFiles,
        persons,
        groups,
        places,
        relsPersonPlace,
        territories,
        territoryObservations,
        reports,
      },
    });
  })
);

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("superadmin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        orgName: z.string().min(1),
        name: z.string().min(1),
        email: z.string().email(),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in organisation post: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { orgName, name, email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!!user) return res.status(400).send({ ok: false, error: "Cet email existe déjà dans une autre organisation" });

    const organisation = await Organisation.create({ name: orgName }, { returning: true });
    const token = crypto.randomBytes(20).toString("hex");
    const adminUser = await User.create(
      {
        name: name,
        email: email.trim().toLowerCase(),
        password: crypto.randomBytes(60).toString("hex"), // A useless password.,
        role: "admin",
        organisation: organisation._id,
        forgotPasswordResetToken: token,
        forgotPasswordResetExpires: new Date(Date.now() + JWT_MAX_AGE * 1000),
      },
      { returning: true }
    );

    const subject = "Bienvenue dans Mano 👋";
    const body = `Bonjour ${adminUser.name} !

Un compte Mano pour votre organisation ${organisation.name} vient d'être créé.

Votre identifiant pour vous connecter à Mano est ${adminUser.email}.
Vous pouvez dès à présent vous connecter pour choisir votre mot de passe ici:
https://dashboard-mano.fabrique.social.gouv.fr/auth/reset?token=${token}

Vous pourrez ensuite paramétrer votre organisation et commencer à utiliser Mano en suivant ce lien:
https://dashboard-mano.fabrique.social.gouv.fr/

Enfin, vous pourrez télécharger l'application sur votre téléphone Android en suivant ce lien:
https://mano-app.fabrique.social.gouv.fr/download

Toute l'équipe Mano vous souhaite la bienvenue !

Si vous avez des questions n'hésitez pas à nous contacter:

Nathan Fradin, chargé de déploiement: nathan.fradin.mano@gmail.com - +33 6 29 54 94 26
Melissa Saiter, chargée de déploiement Mano m.saiter.mano@gmail.com - +33 6 13 23 33 45
Yoann Kittery, chargé de déploiement Mano ykittery.mano@gmail.com - +33 6 83 98 29 66
Guillaume Demirhan, porteur du projet: g.demirhan@aurore.asso.fr - +33 7 66 56 19 96
`;
    await mailservice.sendEmail(adminUser.email, subject, body);

    return res.status(200).send({ ok: true });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("superadmin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        withCounters: z.optional(z.enum(["true", "false"])),
      }).parse(req.query);
    } catch (e) {
      const error = new Error(`Invalid request in organisation get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { withCounters } = req.query;
    const data = await Organisation.findAll();
    if (withCounters !== "true") return res.status(200).send({ ok: true, data });

    const countQuery = {
      group: ["organisation"],
      attributes: ["organisation", [fn("COUNT", "TagName"), "countByOrg"]],
    };
    const actions = (await Action.findAll(countQuery)).map((item) => item.toJSON());
    const persons = (await Person.findAll(countQuery)).map((item) => item.toJSON());
    const groups = (await Group.findAll(countQuery)).map((item) => item.toJSON());
    const territories = (await Territory.findAll(countQuery)).map((item) => item.toJSON());
    const reports = (await Report.findAll(countQuery)).map((item) => item.toJSON());
    const comments = (await Comment.findAll(countQuery)).map((item) => item.toJSON());
    const passages = (await Passage.findAll(countQuery)).map((item) => item.toJSON());
    const rencontres = (await Rencontre.findAll(countQuery)).map((item) => item.toJSON());

    return res.status(200).send({
      ok: true,
      data: data
        .map((org) => org.toJSON())
        .map((org) => {
          const counters = {
            actions: actions.find((a) => a.organisation === org._id) ? Number(actions.find((a) => a.organisation === org._id).countByOrg) : 0,
            persons: persons.find((p) => p.organisation === org._id) ? Number(persons.find((p) => p.organisation === org._id).countByOrg) : 0,
            groups: groups.find((p) => p.organisation === org._id) ? Number(groups.find((p) => p.organisation === org._id).countByOrg) : 0,
            territories: territories.find((t) => t.organisation === org._id)
              ? Number(territories.find((t) => t.organisation === org._id).countByOrg)
              : 0,
            reports: reports.find((r) => r.organisation === org._id) ? Number(reports.find((r) => r.organisation === org._id).countByOrg) : 0,
            comments: comments.find((r) => r.organisation === org._id) ? Number(comments.find((r) => r.organisation === org._id).countByOrg) : 0,
            passages: passages.find((r) => r.organisation === org._id) ? Number(passages.find((r) => r.organisation === org._id).countByOrg) : 0,
            rencontres: rencontres.find((r) => r.organisation === org._id)
              ? Number(rencontres.find((r) => r.organisation === org._id).countByOrg)
              : 0,
          };
          return {
            ...org,
            counters,
            countersTotal: Object.keys(counters).reduce((total, key) => total + (counters[key] || 0), 0),
          };
        }),
    });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      const bodyToParse = {
        name: z.optional(z.string().min(1)),
        encryptedVerificationKey: z.optional(z.string().min(1)),
        encryptionEnabled: z.optional(z.boolean()),
        groupsEnabled: z.optional(z.boolean()),

        actionsGroupedCategories: z.optional(z.array(z.object({ actionsGroupedCategories: z.string(), categories: z.array(z.string().min(1)) }))),

        collaborations: z.optional(z.array(z.string().min(1))),
        receptionEnabled: z.optional(z.boolean()),
        groupedServices: z.optional(z.array(z.object({ groupedServices: z.string(), services: z.array(z.string().min(1)) }))),

        customFieldsPersons: z.optional(
          z.array(
            z.object({
              name: z.string().min(1),
              fields: z.array(customFieldSchema),
            })
          )
        ),
        customFieldsObs: z.optional(z.array(customFieldSchema)),
        customFieldsMedicalFile: z.optional(z.array(customFieldSchema)),
        consultations: z.optional(
          z.array(
            z.object({
              name: z.string().min(1),
              fields: z.array(customFieldSchema),
            })
          )
        ),
        // kept for retro-compatibility only
        categories: z.optional(z.array(z.string().min(1))),
        services: z.optional(z.array(z.string().min(1))),
        fieldsPersonsCustomizableOptions: z.optional(z.array(customFieldSchema)),
        customFieldsPersonsSocial: z.optional(z.array(customFieldSchema)),
        customFieldsPersonsMedical: z.optional(z.array(customFieldSchema)),
      };
      if (req.body.encryptionLastUpdateAt) {
        bodyToParse.encryptionLastUpdateAt = z.preprocess((input) => new Date(input), z.date());
      }
      z.object({
        params: z.object({
          _id: z.string().regex(looseUuidRegex),
        }),
        body: z.object(req.user.role !== "admin" ? { collaborations: z.array(z.string()) } : bodyToParse),
      });
    } catch (e) {
      const error = new Error(`Invalid request in organisation put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { _id } = req.params;

    const canUpdate = req.user.organisation === _id;
    if (!canUpdate) return res.status(403).send({ ok: false, error: "Forbidden" });

    const organisation = await Organisation.findOne({ where: { _id } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    if (req.user.role !== "admin") {
      await organisation.update({ collaborations: req.body.collaborations });
      return res.status(200).send({ ok: true, data: serializeOrganisation(organisation) });
    }

    const updateOrg = {};
    if (req.body.hasOwnProperty("name")) updateOrg.name = req.body.name;
    if (req.body.hasOwnProperty("encryptedVerificationKey")) updateOrg.encryptedVerificationKey = req.body.encryptedVerificationKey;
    if (req.body.hasOwnProperty("encryptionEnabled")) updateOrg.encryptionEnabled = req.body.encryptionEnabled;
    if (req.body.hasOwnProperty("encryptionLastUpdateAt")) updateOrg.encryptionLastUpdateAt = req.body.encryptionLastUpdateAt;
    if (req.body.hasOwnProperty("groupsEnabled")) updateOrg.groupsEnabled = req.body.groupsEnabled;

    if (req.body.hasOwnProperty("actionsGroupedCategories")) updateOrg.actionsGroupedCategories = req.body.actionsGroupedCategories;

    if (req.body.hasOwnProperty("collaborations")) updateOrg.collaborations = req.body.collaborations;
    if (req.body.hasOwnProperty("receptionEnabled")) updateOrg.receptionEnabled = req.body.receptionEnabled;
    if (req.body.hasOwnProperty("groupedServices")) updateOrg.groupedServices = req.body.groupedServices;

    if (req.body.hasOwnProperty("customFieldsObs"))
      updateOrg.customFieldsObs = typeof req.body.customFieldsObs === "string" ? JSON.parse(req.body.customFieldsObs) : req.body.customFieldsObs;
    if (req.body.hasOwnProperty("customFieldsPersons"))
      updateOrg.customFieldsPersons =
        typeof req.body.customFieldsPersons === "string" ? JSON.parse(req.body.customFieldsPersons) : req.body.customFieldsPersons;
    if (req.body.hasOwnProperty("customFieldsMedicalFile"))
      updateOrg.customFieldsMedicalFile =
        typeof req.body.customFieldsMedicalFile === "string" ? JSON.parse(req.body.customFieldsMedicalFile) : req.body.customFieldsMedicalFile;
    if (req.body.hasOwnProperty("consultations"))
      updateOrg.consultations = typeof req.body.consultations === "string" ? JSON.parse(req.body.consultations) : req.body.consultations;

    // kept for retro-compatibility only
    if (req.body.hasOwnProperty("services")) updateOrg.services = req.body.services;
    if (req.body.hasOwnProperty("categories")) updateOrg.categories = req.body.categories;
    if (req.body.hasOwnProperty("fieldsPersonsCustomizableOptions"))
      updateOrg.fieldsPersonsCustomizableOptions =
        typeof req.body.fieldsPersonsCustomizableOptions === "string"
          ? JSON.parse(req.body.fieldsPersonsCustomizableOptions)
          : req.body.fieldsPersonsCustomizableOptions;
    if (req.body.hasOwnProperty("customFieldsPersonsSocial"))
      updateOrg.customFieldsPersonsSocial =
        typeof req.body.customFieldsPersonsSocial === "string" ? JSON.parse(req.body.customFieldsPersonsSocial) : req.body.customFieldsPersonsSocial;
    if (req.body.hasOwnProperty("customFieldsPersonsMedical"))
      updateOrg.customFieldsPersonsMedical =
        typeof req.body.customFieldsPersonsMedical === "string"
          ? JSON.parse(req.body.customFieldsPersonsMedical)
          : req.body.customFieldsPersonsMedical;

    await organisation.update(updateOrg);

    return res.status(200).send({
      ok: true,
      data: serializeOrganisation(organisation),
    });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["superadmin", "admin"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in organisation delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    // Super admin can delete any organisation. Admin can delete only their organisation.
    const canDelete = req.user.role === "superadmin" || (req.user.role === "admin" && req.user.organisation === req.params._id);
    if (!canDelete) return res.status(403).send({ ok: false, error: "Forbidden" });

    const result = await Organisation.destroy({ where: { _id: req.params._id } });
    if (result === 0) return res.status(404).send({ ok: false, error: "Not Found" });
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
