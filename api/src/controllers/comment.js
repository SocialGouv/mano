const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const Comment = require("../models/comment");
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
      z.object({
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
        team: z.string().regex(looseUuidRegex),
        person: z.string().regex(looseUuidRegex).optional().nullable(),
        action: z.string().regex(looseUuidRegex).optional().nullable(),
      })
        .refine((comment) => !!comment.person || !!comment.action)
        .parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in comment creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const data = await Comment.create(
      {
        organisation: req.user.organisation,
        encrypted: req.body.encrypted,
        encryptedEntityKey: req.body.encryptedEntityKey,
        action: req.body.action,
        person: req.body.person,
        team: req.body.team,
        user: req.user._id,
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
        person: data.person,
        action: data.action,
        team: data.team,
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
      const error = new Error(`Invalid request in comment get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await Comment.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await Comment.findAll({
      ...query,
      attributes: [
        "_id",
        "encrypted",
        "encryptedEntityKey",
        "person",
        "action",
        "team",
        "user",
        "organisation",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ],
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
      z.optional(z.string().regex(looseUuidRegex).parse(req.body.person));
      z.optional(z.string().regex(looseUuidRegex).parse(req.body.action));
      z.optional(z.string().regex(looseUuidRegex).parse(req.body.team));
      z.optional(z.string().regex(looseUuidRegex).parse(req.body.user));
    } catch (e) {
      const error = new Error(`Invalid request in comment put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const comment = await Comment.findOne(query);
    if (!comment) return res.status(404).send({ ok: false, error: "Not Found" });

    const { encrypted, encryptedEntityKey, person, action, team, user } = req.body;

    const updateComment = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
      person: person,
      action: action,
      team: team,
      user: user,
    };

    await Comment.update(updateComment, query, { silent: false });
    const newComment = await Comment.findOne(query);

    return res.status(200).send({
      ok: true,
      data: {
        _id: newComment._id,
        encrypted: newComment.encrypted,
        encryptedEntityKey: newComment.encryptedEntityKey,
        organisation: newComment.organisation,
        person: newComment.person,
        action: newComment.action,
        team: newComment.team,
        user: newComment.user,
        createdAt: newComment.createdAt,
        updatedAt: newComment.updatedAt,
        deletedAt: newComment.deletedAt,
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
      const error = new Error(`Invalid request in comment delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    const comment = await Comment.findOne(query);
    if (!comment) return res.status(200).send({ ok: true });

    await comment.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
