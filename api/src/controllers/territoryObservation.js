const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");
const { catchErrors } = require("../errors");
const TerritoryObservation = require("../models/territoryObservation");
const { Op } = require("sequelize");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
    } catch (e) {
      const error = new Error(`Invalid request in observation creation: ${e}`);
      error.status = 400;
      return next(error);
    }
    const newObs = {
      organisation: req.user.organisation,
      encrypted: req.body.encrypted,
      encryptedEntityKey: req.body.encryptedEntityKey,
    };

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
        deletedAt: data.deletedAt,
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.limit);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.page);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.lastRefresh);
    } catch (e) {
      const error = new Error(`Invalid request in observation get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, lastRefresh } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await TerritoryObservation.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (lastRefresh) {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(lastRefresh)) } }, { deletedAt: { [Op.gte]: new Date(Number(lastRefresh)) } }];
      query.paranoid = false;
    }

    const data = await TerritoryObservation.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "createdAt", "updatedAt", "deletedAt"],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === Number(limit), total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
    } catch (e) {
      const error = new Error(`Invalid request in observation put: ${e}`);
      error.status = 400;
      return next(error);
    }

    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const territoryObservation = await TerritoryObservation.findOne(query);
    if (!territoryObservation) return res.status(404).send({ ok: false, error: "Not Found" });

    const { encrypted, encryptedEntityKey } = req.body;
    const updatedTerritoryObservation = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
    };

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
        deletedAt: newTerritoryObservation.deletedAt,
      },
    });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      const error = new Error(`Invalid request in observation delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    let observation = await TerritoryObservation.findOne(query);
    if (!observation) return res.status(404).send({ ok: false, error: "Not Found" });

    observation.set({ encrypted: null, encryptedEntityKey: null });
    await observation.save();

    await observation.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
