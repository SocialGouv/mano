const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");

const { catchErrors } = require("../errors");
const Comment = require("../models/comment");
const encryptedTransaction = require("../utils/encryptedTransaction");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    const newComment = {};

    newComment.organisation = req.user.organisation;

    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in comment creation");
    }
    if (req.body.hasOwnProperty("encrypted")) newComment.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newComment.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      const data = await Comment.create(newComment, { returning: true, transaction: tx });
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
    }

    const total = await Comment.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await Comment.findAll({
      ...query,
      attributes: [
        // Generic fields
        "_id",
        "encrypted",
        "encryptedEntityKey",
        "organisation",
        "createdAt",
        "updatedAt",
      ],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    if (!req.body.comment) return res.status(400).send({ ok: false, error: "Comment is missing" });

    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const comment = await Comment.findOne(query);
    if (!comment) return res.status(404).send({ ok: false, error: "Not Found" });

    const updateComment = {};

    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in comment update");
    }
    if (req.body.hasOwnProperty("encrypted")) updateComment.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updateComment.encryptedEntityKey = req.body.encryptedEntityKey || null;
    // FIXME: This pattern should be avoided. createdAt should be updated only when it is created.
    if (req.body.hasOwnProperty("createdAt") && !!req.body.createdAt) {
      comment.changed("createdAt", true);
      updateComment.createdAt = new Date(req.body.createdAt);
    }

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      await Comment.update(updateComment, query, { silent: false, transaction: tx });
      // According to this comment, we should use transaction here:
      // https://github.com/sequelize/sequelize/issues/10858#issuecomment-549817032
      const newComment = await Comment.findOne({ ...query, transaction: tx });
      return newComment;
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

    const comment = await Comment.findOne(query);
    if (!comment) return res.status(200).send({ ok: true });

    await comment.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
