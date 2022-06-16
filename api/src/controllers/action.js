const express = require("express");
const { z } = require("zod");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { catchErrors } = require("../errors");
const validateUser = require("../middleware/validateUser");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const Action = require("../models/action");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");

const TODO = "A FAIRE";
const DONE = "FAIT";
const CANCEL = "ANNULEE";
const STATUS = [TODO, DONE, CANCEL];

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "non-professional"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.enum(STATUS).parse(req.body.status);
      z.preprocess((input) => new Date(input), z.date()).parse(req.body.dueAt);
      if (req.body.completedAt) z.preprocess((input) => new Date(input), z.date()).parse(req.body.completedAt);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
    } catch (e) {
      const error = new Error(`Invalid request in action creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const { status, dueAt, completedAt, encrypted, encryptedEntityKey } = req.body;
    const action = {
      organisation: req.user.organisation,
      status,
      dueAt,
      completedAt: completedAt || null,
      encrypted,
      encryptedEntityKey,
    };

    const data = await Action.create(action, { returning: true });
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
        status: data.status,
        dueAt: data.dueAt,
        completedAt: data.completedAt,
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "non-professional"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.limit);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.page);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.lastRefresh);
      z.optional(z.enum(["true", "false"])).parse(req.query.withDeleted);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.after);
    } catch (e) {
      const error = new Error(`Invalid request in action get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, lastRefresh, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [
        ["status", "ASC"],
        ["dueAt", "ASC"],
        ["createdAt", "ASC"],
      ],
    };

    const total = await Action.count(query);
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

    const sortDoneOrCancel = (a, b) => {
      if (!a.dueAt) return -1;
      if (!b.dueAt) return 1;
      if (a.dueAt > b.dueAt) return -1;
      return 1;
    };

    const actions = await Action.findAll({
      ...query,
      attributes: [
        // Generic fields
        "_id",
        "encrypted",
        "encryptedEntityKey",
        "organisation",
        "createdAt",
        "updatedAt",
        "deletedAt",
        // Specific fields that are not encrypted
        "status",
        "dueAt",
        "completedAt",
        // All other fields are encrypted and should not be returned.
      ],
    });
    const todo = actions.filter((a) => a.status === TODO);
    const done = actions.filter((a) => a.status === DONE).sort(sortDoneOrCancel);
    const cancel = actions.filter((a) => a.status === CANCEL).sort(sortDoneOrCancel);
    const data = [...todo, ...done, ...cancel];
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
      z.enum(STATUS).parse(req.body.status);
      z.preprocess((input) => new Date(input), z.date()).parse(req.body.dueAt);
      if (req.body.completedAt) z.preprocess((input) => new Date(input), z.date()).parse(req.body.completedAt);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
    } catch (e) {
      const error = new Error(`Invalid request in action put: ${e}`);
      error.status = 400;
      return next(error);
    }

    const action = await Action.findOne({
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    });
    if (!action) return res.status(404).send({ ok: false, error: "Not Found" });

    const { status, dueAt, completedAt, encrypted, encryptedEntityKey } = req.body;
    action.set({
      status,
      dueAt,
      completedAt: completedAt || null,
      encrypted,
      encryptedEntityKey,
    });
    await action.save();

    return res.status(200).send({
      ok: true,
      data: {
        _id: action._id,
        encrypted: action.encrypted,
        encryptedEntityKey: action.encryptedEntityKey,
        organisation: action.organisation,
        createdAt: action.createdAt,
        updatedAt: action.updatedAt,
        deletedAt: action.deletedAt,
        status: action.status,
        dueAt: action.dueAt,
        completedAt: action.completedAt,
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
      const error = new Error(`Invalid request in action delete: ${e}`);
      error.status = 400;
      return next(error);
    }

    const action = await Action.findOne({
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    });
    if (!action) return res.status(200).send({ ok: true });

    await action.destroy();

    res.status(200).send({ ok: true });
  })
);

module.exports = router;
