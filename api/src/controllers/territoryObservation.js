const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");
const { catchErrors } = require("../errors");
const TerritoryObservation = require("../models/territoryObservation");
const { Op } = require("sequelize");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");
const validateUser = require("../middleware/validateUser");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  validateOrganisationEncryption,
  catchErrors(async (req, res) => {
    try {
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
      if (req.body.createdAt) z.preprocess((input) => new Date(input), z.date()).parse(req.body.createdAt);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const newObs = {
      organisation: req.user.organisation,
      encrypted: req.body.encrypted,
      encryptedEntityKey: req.body.encryptedEntityKey,
    };
    // FIXME: This "createdAt" pattern should be avoided. createdAt should not be updated.
    if (req.body.hasOwnProperty("createdAt")) newObs.createdAt = req.body.createdAt || null;

    const data = await TerritoryObservation.create(newObs, { returning: true });
    return res.status(200).send({
      ok: true,
      data: {
        _id: data._id,
        encrypted: data.encrypted,
        encryptedEntityKey: data.encryptedEntityKey,
        organisation: data.organisation,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
    try {
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.limit);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.page);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.lastRefresh);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const { limit, page, lastRefresh } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await TerritoryObservation.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (lastRefresh) query.where.updatedAt = { [Op.gte]: new Date(Number(lastRefresh)) };

    const data = await TerritoryObservation.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "createdAt", "updatedAt"],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === Number(limit), total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  validateOrganisationEncryption,
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
      if (req.body.createdAt) z.preprocess((input) => new Date(input), z.date()).parse(req.body.createdAt);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }

    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const territoryObservation = await TerritoryObservation.findOne(query);
    if (!territoryObservation) return res.status(404).send({ ok: false, error: "Not Found" });

    const { createdAt, encrypted, encryptedEntityKey } = req.body;
    const updatedTerritoryObservation = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
    };

    // FIXME: This pattern should be avoided. createdAt should be updated only when it is created.
    if (createdAt) {
      territoryObservation.changed("createdAt", true);
      updatedTerritoryObservation.createdAt = new Date(createdAt);
    }

    await TerritoryObservation.update(updatedTerritoryObservation, query, { silent: false });
    const newTerritoryObservation = await TerritoryObservation.findOne(query);

    res.status(200).send({
      ok: true,
      data: {
        _id: newTerritoryObservation._id,
        encrypted: newTerritoryObservation.encrypted,
        encryptedEntityKey: newTerritoryObservation.encryptedEntityKey,
        organisation: newTerritoryObservation.organisation,
        createdAt: newTerritoryObservation.createdAt,
        updatedAt: newTerritoryObservation.updatedAt,
      },
    });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    let observation = await TerritoryObservation.findOne(query);
    if (!observation) return res.status(404).send({ ok: false, error: "Not Found" });

    await observation.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
