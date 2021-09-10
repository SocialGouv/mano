const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");

const Organisation = require("../models/organisation");
const Team = require("../models/team");
const Person = require("../models/person");
const User = require("../models/user");
const Place = require("../models/place");
const RelPersonPlace = require("../models/relPersonPlace");
const RelUserTeam = require("../models/relUserTeam");
const Structure = require("../models/structure");
const Action = require("../models/action");
const Comment = require("../models/comment");
const Territory = require("../models/territory");
const Report = require("../models/report");
const TerritoryObservation = require("../models/territoryObservation");
const RelPersonTeam = require("../models/relPersonTeam");
const { capture } = require("../sentry");
const { sequelize } = require("../models/organisation");
const encryptedTransaction = require("../utils/encryptedTransaction");

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
      throw new Error("Only an admin can change the encryption");
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
    if (req.user.role !== "admin") {
      throw new Error("Only an admin can change the encryption");
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

        const now = Date.now();
        console.log(
          actions.length,
          persons.length,
          comments.length,
          territories.length,
          observations.length,
          places.length,
          relsPersonPlace.length,
          reports.length
        );

        for (let { encrypted, encryptedEntityKey, _id } of persons) {
          await Person.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }
        console.log("Person DONE", Date.now() - now);

        for (let { encrypted, encryptedEntityKey, _id } of actions) {
          await Action.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }
        console.log("ACTION DONE", Date.now() - now);

        for (let { encrypted, encryptedEntityKey, _id } of comments) {
          await Comment.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }
        console.log("Comment DONE", Date.now() - now);

        for (let { encrypted, encryptedEntityKey, _id } of territories) {
          await Territory.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }
        console.log("Territory DONE", Date.now() - now);

        for (let { encrypted, encryptedEntityKey, _id } of observations) {
          await TerritoryObservation.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }
        console.log("TerritoryObservation DONE", Date.now() - now);

        for (let { encrypted, encryptedEntityKey, _id } of places) {
          await Place.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }
        console.log("Place DONE", Date.now() - now);

        for (let { encrypted, encryptedEntityKey, _id } of relsPersonPlace) {
          await RelPersonPlace.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }
        console.log("RelPersonPlace DONE", Date.now() - now);

        for (let { encrypted, encryptedEntityKey, _id } of reports) {
          await Report.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }
        console.log("Report DONE", Date.now() - now);

        console.log("DONE", Date.now() - now);
        console.log(
          "average",
          (Date.now() - now) /
            (actions.length +
              persons.length +
              comments.length +
              territories.length +
              observations.length +
              places.length +
              relsPersonPlace.length +
              reports.length)
        );
      } catch (e) {
        console.log("error encrypting", e);
        throw e;
      }
    });

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });

    return res.status(status).send({ ok, error, data: organisation });
  })
);

module.exports = router;
