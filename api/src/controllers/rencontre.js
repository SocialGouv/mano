const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const { Rencontre } = require("../db/sequelize");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");

router.post(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "restricted-access"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in rencontre creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const data = await Rencontre.create(
      {
        organisation: req.user.organisation,
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
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "restricted-access", "stats-only"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        limit: z.optional(z.string().regex(positiveIntegerRegex)),
        page: z.optional(z.string().regex(positiveIntegerRegex)),
        after: z.optional(z.string().regex(positiveIntegerRegex)),
        withDeleted: z.optional(z.enum(["true", "false"])),
      }).parse(req.query);
    } catch (e) {
      const error = new Error(`Invalid request in rencontre get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await Rencontre.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await Rencontre.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "createdAt", "updatedAt", "deletedAt"],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === Number(limit), total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "restricted-access"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        params: z.object({
          _id: z.string().regex(looseUuidRegex),
        }),
        body: z.object({
          encrypted: z.string(),
          encryptedEntityKey: z.string(),
          ...(req.body.createdAt ? { createdAt: z.preprocess((input) => new Date(input), z.date()) } : {}),
        }),
      }).parse(req);
    } catch (e) {
      const error = new Error(`Invalid request in rencontre put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const rencontre = await Rencontre.findOne(query);
    if (!rencontre) return res.status(404).send({ ok: false, error: "Not Found" });

    const { encrypted, encryptedEntityKey } = req.body;

    const updateRencontre = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
    };

    await Rencontre.update(updateRencontre, query, { silent: false });
    const newRencontre = await Rencontre.findOne(query);

    return res.status(200).send({
      ok: true,
      data: {
        _id: newRencontre._id,
        encrypted: newRencontre.encrypted,
        encryptedEntityKey: newRencontre.encryptedEntityKey,
        organisation: newRencontre.organisation,
        createdAt: newRencontre.createdAt,
        updatedAt: newRencontre.updatedAt,
        deletedAt: newRencontre.deletedAt,
      },
    });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in rencontre delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    const rencontre = await Rencontre.findOne(query);
    if (!rencontre) return res.status(404).send({ ok: false, error: "Not Found" });

    await rencontre.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
