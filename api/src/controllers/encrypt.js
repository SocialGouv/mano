const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const Person = require("../models/person");
const Place = require("../models/place");
const RelPersonPlace = require("../models/relPersonPlace");
const Action = require("../models/action");
const Comment = require("../models/comment");
const Territory = require("../models/territory");
const Report = require("../models/report");
const TerritoryObservation = require("../models/territoryObservation");
const sequelize = require("../db/sequelize");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex } = require("../utils");

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
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res) => {
    try {
      const objectsKeys = ["actions", "persons", "comments", "territories", "observations", "places", "reports", "relsPersonPlace"];
      for (const objectKey of objectsKeys) {
        z.array(
          z.object({
            _id: z.string().regex(looseUuidRegex),
            encrypted: z.string(),
            encryptedEntityKey: z.string(),
          })
        ).parse(req.body[objectKey]);
      }
      z.preprocess((input) => new Date(input), z.date()).parse(req.body.encryptionLastUpdateAt || 0);
      z.string().parse(req.body.encryptedVerificationKey);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }

    let organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (organisation.encrypting) {
      return res.status(403).send({ ok: false, error: "L'organisation est déjà en cours de chiffrement" });
    }
    organisation.set({ encrypting: true });
    await organisation.save();

    try {
      await sequelize.transaction(async (tx) => {
        const {
          actions = [],
          persons = [],
          comments = [],
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

        for (let { encrypted, encryptedEntityKey, _id } of persons) {
          await Person.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        for (let { encrypted, encryptedEntityKey, _id } of actions) {
          await Action.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        for (let { encrypted, encryptedEntityKey, _id } of comments) {
          await Comment.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        for (let { encrypted, encryptedEntityKey, _id } of territories) {
          await Territory.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        for (let { encrypted, encryptedEntityKey, _id } of observations) {
          await TerritoryObservation.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        for (let { encrypted, encryptedEntityKey, _id } of places) {
          await Place.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        for (let { encrypted, encryptedEntityKey, _id } of relsPersonPlace) {
          await RelPersonPlace.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        for (let { encrypted, encryptedEntityKey, _id } of reports) {
          await Report.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }
        organisation.set({
          encryptionEnabled: "true",
          encryptionLastUpdateAt: new Date(),
          encrypting: false,
          encryptedVerificationKey,
        });
        await organisation.save({ transaction: tx });
      });
    } catch (e) {
      capture("error encrypting", e);
      organisation.set({ encrypting: false });
      await organisation.save();
      throw e;
    }

    return res.status(200).send({ ok: true, data: organisation });
  })
);

module.exports = router;
