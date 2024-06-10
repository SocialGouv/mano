const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const {
  Organisation,
  Person,
  Group,
  Place,
  RelPersonPlace,
  Action,
  Consultation,
  Treatment,
  MedicalFile,
  Comment,
  Passage,
  Rencontre,
  Territory,
  Report,
  TerritoryObservation,
  sequelize,
  UserLog,
} = require("../db/sequelize");

const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex } = require("../utils");
const { serializeOrganisation } = require("../utils/data-serializer");

// This controller is required because:
//   - If we encrypt one by one each of the actions, persons, comments, territories, observations, places, reports
//   - If we make a PUT for everyone of these items
//   - IF WE LOSE INTERNET CONNECTION IN BETWEEN (which happened already in development mode)
// => We end up with a part of the data encrypted with one key, another with another key
//    so we lose a big part of the data
//
// So we need to send all the new encrypted data in one shot
// and to make sure everything is changed by using a transaction.
router.post(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    const objectsKeys = [
      "actions",
      "consultations",
      "treatments",
      "medicalFiles",
      "persons",
      "groups",
      "comments",
      "passages",
      "rencontres",
      "territories",
      "observations",
      "places",
      "reports",
      "relsPersonPlace",
    ];
    for (const objectKey of objectsKeys) {
      try {
        z.array(
          z.object({
            _id: z.string().regex(looseUuidRegex),
            encrypted: z.string(),
            encryptedEntityKey: z.string(),
          })
        ).parse(req.body[objectKey]);
      } catch (e) {
        const error = new Error(`Invalid request in encrypt objectKey ${objectKey}: ${e}`);
        error.status = 400;
        return next(error);
      }
    }
    try {
      z.object({
        encryptionLastUpdateAt: z.optional(z.preprocess((input) => new Date(input), z.date())),
        encryptedVerificationKey: z.string(),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in encryption parameters: ${e}`);
      error.status = 400;
      return next(error);
    }

    let organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (organisation.encrypting) {
      return res.status(403).send({ ok: false, error: "L'organisation est déjà en cours de chiffrement" });
    }
    organisation.set({ encrypting: true });
    await organisation.save();

    UserLog.create({
      organisation: req.user.organisation,
      user: req.user._id,
      platform: req.headers.platform === "android" ? "app" : req.headers.platform === "dashboard" ? "dashboard" : "unknown",
      action: "change-encryption-key",
    });

    try {
      await sequelize.transaction(async (tx) => {
        const {
          actions = [],
          consultations = [],
          treatments = [],
          medicalFiles = [],
          persons = [],
          groups = [],
          comments = [],
          passages = [],
          rencontres = [],
          territories = [],
          observations = [],
          places = [],
          reports = [],
          relsPersonPlace = [],
          encryptionLastUpdateAt,
          encryptedVerificationKey,
        } = req.body;

        if (Date.parse(new Date(encryptionLastUpdateAt)) < Date.parse(new Date(organisation.encryptionLastUpdateAt))) {
          throw new Error("La clé de chiffrement a changé. Veuillez vous déconnecter et vous reconnecter avec la nouvelle clé.");
        }

        // Why paranoid false everywhere?
        // Because we want to recrypt deleted items too. Otherwise, they would be lost forever.

        for (let { encrypted, encryptedEntityKey, _id } of persons) {
          await Person.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of groups) {
          await Group.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of actions) {
          await Action.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of consultations) {
          await Consultation.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of treatments) {
          await Treatment.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of medicalFiles) {
          await MedicalFile.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of comments) {
          await Comment.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of passages) {
          await Passage.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of rencontres) {
          await Rencontre.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of territories) {
          await Territory.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of observations) {
          await TerritoryObservation.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of places) {
          await Place.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of relsPersonPlace) {
          await RelPersonPlace.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }

        for (let { encrypted, encryptedEntityKey, _id } of reports) {
          await Report.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
        }
        organisation.set({
          encryptionEnabled: "true",
          encryptionLastUpdateAt: new Date(),
          encrypting: false,
          lockedForEncryption: false,
          encryptedVerificationKey,
        });
        await organisation.save({ transaction: tx });
      });
    } catch (e) {
      capture("error encrypting", e);
      organisation.set({ encrypting: false, lockedForEncryption: false });
      await organisation.save();
      throw e;
    }

    return res.status(200).send({ ok: true, data: serializeOrganisation(organisation) });
  })
);

module.exports = router;
