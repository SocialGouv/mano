const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");
const TerritoryObservation = require("../models/territoryObservation");
const encryptedTransaction = require("../utils/encryptedTransaction");
const { Op } = require("sequelize");

//checked
router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const newObs = {};

    newObs.organisation = req.user.organisation;
    newObs.user = req.user._id;
    newObs.team = req.body.team;

    if (!newObs.team) return res.status(400).send({ ok: false, error: "Team is required" });

    if (req.body.hasOwnProperty("personsMale")) newObs.personsMale = req.body.personsMale || null;
    if (req.body.hasOwnProperty("personsFemale")) newObs.personsFemale = req.body.personsFemale || null;
    if (req.body.hasOwnProperty("police")) newObs.police = req.body.police || null;
    if (req.body.hasOwnProperty("material")) newObs.material = req.body.material || null;
    if (req.body.hasOwnProperty("atmosphere")) newObs.atmosphere = req.body.atmosphere || null;
    if (req.body.hasOwnProperty("mediation")) newObs.mediation = req.body.mediation || null;
    if (req.body.hasOwnProperty("comment")) newObs.comment = req.body.comment || null;
    if (req.body.hasOwnProperty("createdAt")) newObs.createdAt = req.body.createdAt || null;
    if (req.body.hasOwnProperty("territory")) newObs.territory = req.body.territory || null;

    if (req.body.hasOwnProperty("encrypted")) newObs.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newObs.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      const data = await TerritoryObservation.create(newObs, { returning: true, transaction: tx });
      return data;
    });

    return res.status(status).send({ ok, data, error });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        organisation: req.user.organisation,
      },
      order: [["createdAt", "DESC"]],
    };

    if (req.query.lastRefresh) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(req.query.lastRefresh)) };
      const data = await TerritoryObservation.findAll(query);
      return res.status(200).send({ ok: true, data });
    }

    const total = await TerritoryObservation.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await TerritoryObservation.findAll(query);
    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };
    const updateObs = {};

    const observation = await TerritoryObservation.findOne(query);
    if (!observation) return res.status(404).send({ ok: false, error: "Not found" });

    if (req.body.hasOwnProperty("personsMale")) updateObs.personsMale = req.body.personsMale || null;
    if (req.body.hasOwnProperty("personsFemale")) updateObs.personsFemale = req.body.personsFemale || null;
    if (req.body.hasOwnProperty("police")) updateObs.police = req.body.police || null;
    if (req.body.hasOwnProperty("material")) updateObs.material = req.body.material || null;
    if (req.body.hasOwnProperty("atmosphere")) updateObs.atmosphere = req.body.atmosphere || null;
    if (req.body.hasOwnProperty("mediation")) updateObs.mediation = req.body.mediation || null;
    if (req.body.hasOwnProperty("createdAt")) {
      observation.changed("createdAt", true);
      updateObs.createdAt = req.body.createdAt || null;
    }
    if (req.body.hasOwnProperty("comment")) updateObs.comment = req.body.comment || null;

    if (req.body.hasOwnProperty("encrypted")) updateObs.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updateObs.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      await TerritoryObservation.update(updateObs, query, { silent: false, transaction: tx });
      const newObservation = await TerritoryObservation.findOne(query);
      return newObservation;
    });

    return res.status(status).send({ ok, data, error });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };

    let observation = await TerritoryObservation.findOne(query);
    if (!observation) return res.status(404).send({ ok: false, error: "Not Found" });

    await observation.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
