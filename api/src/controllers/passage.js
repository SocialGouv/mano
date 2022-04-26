const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const Passage = require("../models/passage");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");

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
      const error = new Error(`Invalid request in passage creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const data = await Passage.create(
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
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.limit);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.page);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.lastRefresh);
      z.optional(z.enum(["true", "false"])).parse(req.query.withDeleted);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.after);
    } catch (e) {
      const error = new Error(`Invalid request in passage get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, lastRefresh, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await Passage.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (lastRefresh) {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(lastRefresh)) } }];
    }
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await Passage.findAll({
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
      if (req.body.createdAt) z.preprocess((input) => new Date(input), z.date()).parse(req.body.createdAt);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
    } catch (e) {
      const error = new Error(`Invalid request in passage put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const passage = await Passage.findOne(query);
    if (!passage) return res.status(404).send({ ok: false, error: "Not Found" });

    const { encrypted, encryptedEntityKey } = req.body;

    const updatePassage = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
    };

    await Passage.update(updatePassage, query, { silent: false });
    const newPassage = await Passage.findOne(query);

    return res.status(200).send({
      ok: true,
      data: {
        _id: newPassage._id,
        encrypted: newPassage.encrypted,
        encryptedEntityKey: newPassage.encryptedEntityKey,
        organisation: newPassage.organisation,
        createdAt: newPassage.createdAt,
        updatedAt: newPassage.updatedAt,
        deletedAt: newPassage.deletedAt,
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
      const error = new Error(`Invalid request in passage delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    const passage = await Passage.findOne(query);
    if (!passage) return res.status(200).send({ ok: true });

    passage.set({ encrypted: null, encryptedEntityKey: null });
    await passage.save();

    await passage.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
