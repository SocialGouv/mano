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
      z.string().regex(looseUuidRegex).parse(req.body.territory);
      z.string().regex(looseUuidRegex).parse(req.body.team);
    } catch (e) {
      const error = new Error(`Invalid request in observation creation: ${e}`);
      error.status = 400;
      return next(error);
    }
    const newObs = {
      organisation: req.user.organisation,
      user: req.user._id,
      team: req.body.team,
      territory: req.body.territory,
      encrypted: req.body.encrypted,
      encryptedEntityKey: req.body.encryptedEntityKey,
    };

    const data = await TerritoryObservation.create(newObs, { returning: true });
    return res.status(200).send({
      ok: true,
      data: {
        _id: data._id,
        organisation: data.organisation,
        user: data.user,
        team: data.team,
        territory: data.territory,
        encrypted: data.encrypted,
        encryptedEntityKey: data.encryptedEntityKey,
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
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.limit);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.page);
      z.optional(z.enum(["true", "false"])).parse(req.query.withDeleted);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.after);
    } catch (e) {
      const error = new Error(`Invalid request in observation get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await TerritoryObservation.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await TerritoryObservation.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "user", "team", "territory", "createdAt", "updatedAt", "deletedAt"],
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
      z.string().regex(looseUuidRegex).parse(req.body.user);
      z.string().regex(looseUuidRegex).parse(req.body.team);
      z.string().regex(looseUuidRegex).parse(req.body.territory);
    } catch (e) {
      const error = new Error(`Invalid request in observation put: ${e}`);
      error.status = 400;
      return next(error);
    }

    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const territoryObservation = await TerritoryObservation.findOne(query);
    if (!territoryObservation) return res.status(404).send({ ok: false, error: "Not Found" });

    const { encrypted, encryptedEntityKey, territory, user, team } = req.body;
    const updatedTerritoryObservation = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
      user: user,
      team: team,
      territory: territory,
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
        user: newTerritoryObservation.user,
        team: newTerritoryObservation.team,
        territory: newTerritoryObservation.territory,
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

    await observation.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
