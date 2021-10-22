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
  catchErrors(async (req, res) => {
    const newComment = {};

    newComment.organisation = req.user.organisation;
    newComment.user = req.user._id;
    newComment.team = req.body.team;

    if (!newComment.team) return res.status(400).send({ ok: false, error: "Team is required" });
    if (!newComment.user) return res.status(400).send({ ok: false, error: "User is required" });

    if (req.body.hasOwnProperty("comment")) newComment.comment = req.body.comment || null;
    if (req.body.hasOwnProperty("type")) newComment.type = req.body.type || null;
    if (req.body.hasOwnProperty("item")) newComment.item = req.body.item || null;
    if (req.body.hasOwnProperty("person")) newComment.person = req.body.person || null;
    if (req.body.hasOwnProperty("action")) newComment.action = req.body.action || null;

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

    const data = await Comment.findAll(query);
    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (!req.body.comment) return res.status(400).send({ ok: false, error: "Comment is missing" });

    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const comment = await Comment.findOne(query);
    if (!comment) return res.status(404).send({ ok: false, error: "Not Found" });

    const updateComment = {};

    if (req.body.hasOwnProperty("comment")) updateComment.comment = req.body.comment || null;
    if (req.body.hasOwnProperty("user")) updateComment.user = req.body.user || null;

    if (req.body.hasOwnProperty("encrypted")) updateComment.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("createdAt") && !!req.body.createdAt) {
      comment.changed("createdAt", true);
      updateComment.createdAt = new Date(req.body.createdAt);
    }
    if (req.body.hasOwnProperty("encryptedEntityKey")) updateComment.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      await Comment.update(updateComment, query, { silent: false, transaction: tx });
      const newComment = await Comment.findOne(query);
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
