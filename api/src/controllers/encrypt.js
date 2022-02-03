const express = require("express");
const router = express.Router();
const passport = require("passport");
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
const encryptedTransaction = require("../utils/encryptedTransaction");
const { capture } = require("../sentry");

// this controller is required BECAUSE
// if we encrypt one by one each of the actions, persons, comments, territories, observations, places, reports
// if we make a PUT for everyone of these items
// IF WE LOSE INTERNET CONNECTION IN BETWEEN (which happened already in development mode)
// we end up with a part of the data encrypted with one key, another with another key
// so we lose a big part of the data

// SO we need to send all the new encrypted data in one shot
// and to make sure everything is changed by using a transaction

router.post(
  "/cancel",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (req.user.role !== "admin") {
      capture("Only an admin can cancel the encryption", { user: req.user });
      return res.send(403).send({ ok: false, error: "Seul un admin peut annuler le chiffrement" });
    }
    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    organisation.set({ encryptionEnabled: false });
    await organisation.save();
    return res.status(200).send({ ok: true, data: organisation });
  })
);
router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      capture("Only an admin and superadmin can change the encryption", { user: req.user });
      return res.status(403).send({ ok: false, error: "Seul un admin peut modifier le chiffrement" });
    }

    if (req.user.role === "superadmin") {
      req.user.organisation = req.body.organisation;
      if (!req.user.organisation) {
        capture("Superadmin must specify an organisation", { user: req.user });
        return res.status(400).send({ ok: false, error: "Superadmin doit spécifier une organisation" });
      }
    }

    const { ok, error, status } = await encryptedTransaction(req)(async (tx) => {
      try {
        const {
          actions = [],
          persons = [],
          comments = [],
          territories = [],
          observations = [],
          places = [],
          reports = [],
          relsPersonPlace = [],
        } = req.body;

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
      } catch (e) {
        console.log("error encrypting", e);
        throw e;
      }
    }, req.user.organisation);

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });

    return res.status(status).send({ ok, error, data: organisation });
  })
);

module.exports = router;
