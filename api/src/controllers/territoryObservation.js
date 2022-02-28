const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const TerritoryObservation = require("../models/territoryObservation");
const { Op } = require("sequelize");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateOrganisationEncryption,
  catchErrors(async (req, res, next) => {
    const newObs = {};
    newObs.organisation = req.user.organisation;

    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in territoryObs create");
    }

    if (req.body.hasOwnProperty("encrypted")) newObs.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newObs.encryptedEntityKey = req.body.encryptedEntityKey || null;
    // FIXME: This "createdAt" pattern should be avoided. createdAt should not be updated.
    if (req.body.hasOwnProperty("createdAt")) newObs.createdAt = req.body.createdAt || null;

    const data = await TerritoryObservation.create(newObs, { returning: true });

    return res.status(200).send({ ok: true, data });
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

    const attributes = [
      // Generic fields
      "_id",
      "encrypted",
      "encryptedEntityKey",
      "organisation",
      "createdAt",
      "updatedAt",
    ];

    if (req.query.lastRefresh) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(req.query.lastRefresh)) };
      const data = await TerritoryObservation.findAll({ ...query, attributes });
      return res.status(200).send({ ok: true, data });
    }

    const total = await TerritoryObservation.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await TerritoryObservation.findAll({ ...query, attributes });
    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateOrganisationEncryption,
  catchErrors(async (req, res, next) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };
    const updateObs = {};

    const observation = await TerritoryObservation.findOne(query);
    if (!observation) return res.status(404).send({ ok: false, error: "Not found" });

    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in territoryObs create");
    }

    if (req.body.hasOwnProperty("encrypted")) updateObs.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updateObs.encryptedEntityKey = req.body.encryptedEntityKey || null;

    // FIXME: This "createdAt" pattern should be avoided. createdAt should not be updated.
    if (req.body.hasOwnProperty("createdAt")) {
      observation.changed("createdAt", true);
      updateObs.createdAt = req.body.createdAt || null;
    }

    await TerritoryObservation.update(updateObs, query, { silent: false });
    const newObservation = await TerritoryObservation.findOne(query);

    return res.status(200).send({ ok: true, data: newObservation });
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
