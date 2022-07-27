const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { Op } = require("sequelize");
const sequelize = require("../db/sequelize");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");
const { catchErrors } = require("../errors");
const Territory = require("../models/territory");
const TerritoryObservation = require("../models/territoryObservation");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in territory creation: ${e}`);
      error.status = 400;
      return next(error);
    }
    const data = await Territory.create(
      {
        organisation: req.user.organisation,
        user: req.user._id,
        encrypted: req.body.encrypted,
        encryptedEntityKey: req.body.encryptedEntityKey,
      },
      { returning: true }
    );
    return res.status(200).send({
      ok: true,
      data: {
        _id: data._id,
        encrypted: data.encrypted,
        encryptedEntityKey: data.encryptedEntityKey,
        organisation: data.organisation,
        user: data.user,
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
      const error = new Error(`Invalid request in territory get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await Territory.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await Territory.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "user", "createdAt", "updatedAt", "deletedAt"],
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
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
      z.object({
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in territory put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const territory = await Territory.findOne(query);
    if (!territory) return res.status(404).send({ ok: false, error: "Not found" });

    const { encrypted, encryptedEntityKey, user } = req.body;

    const updateTerritory = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
      user: user,
    };

    territory.set(updateTerritory);
    await territory.save();

    return res.status(200).send({ ok: true, data: territory });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      const error = new Error(`Invalid request in territory delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    const territory = await Territory.findOne(query);
    if (!territory) return res.status(404).send({ ok: false, error: "Not Found" });

    await sequelize.transaction(async (tx) => {
      await TerritoryObservation.destroy({ where: { territory: req.params._id, organisation: req.user.organisation }, transaction: tx });
      await territory.destroy({ transaction: tx });
    });

    res.status(200).send({ ok: true });
  })
);

module.exports = router;
