const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { catchErrors } = require("../errors");
const Action = require("../models/action");
const encryptedTransaction = require("../utils/encryptedTransaction");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    const newAction = {};

    newAction.organisation = req.user.organisation;

    if (!req.body.team) return res.status(400).send({ ok: false, error: "Team is required" });
    if (req.user.role !== "admin" && !req.user.teams.map((t) => t._id).includes(req.body.team)) {
      return res.send(403).send({ ok: false, error: "No team while creating action" });
    }

    // These fields are not encrypted
    if (req.body.hasOwnProperty("status")) newAction.status = req.body.status || null;
    if (req.body.hasOwnProperty("dueAt")) newAction.dueAt = req.body.dueAt || null;
    if (req.body.hasOwnProperty("completedAt")) newAction.completedAt = req.body.completedAt || null;
    // Encrypted fields.
    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in action creation");
    }
    if (req.body.hasOwnProperty("encrypted")) newAction.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newAction.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      const data = await Action.create(newAction, { returning: true, transaction: tx });
      return data;
    });

    return res.status(status).send({ ok, data, error });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const TODO = "A FAIRE";
    const DONE = "FAIT";
    const CANCEL = "ANNULEE";

    const query = {
      where: {
        organisation: req.user.organisation,
      },
      order: [
        ["status", "ASC"],
        ["dueAt", "ASC"],
        ["createdAt", "ASC"],
      ],
    };
    const total = await Action.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    if (req.query.lastRefresh) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(req.query.lastRefresh)) };
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
    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    const where = { _id: req.params._id };
    where.organisation = req.user.organisation;
    // Todo: check team before updating action for non-admin.

    let action = await Action.findOne({ where });
    if (!action) return res.status(404).send({ ok: false, error: "Not Found" });

    const updateAction = {};

    // These fields are not encrypted
    if (req.body.hasOwnProperty("status")) updateAction.status = req.body.status || null;
    if (req.body.hasOwnProperty("dueAt")) updateAction.dueAt = req.body.dueAt || null;
    if (req.body.hasOwnProperty("completedAt")) updateAction.completedAt = req.body.completedAt || null;
    // Encrypted fields.
    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in action update");
    }
    if (req.body.hasOwnProperty("encrypted")) updateAction.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updateAction.encryptedEntityKey = req.body.encryptedEntityKey || null;

    await action.update(updateAction);

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      action.set(updateAction);
      await action.save({ transaction: tx });
      return action;
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

    if (req.user.role !== "admin") query.where.team = req.user.teams.map((e) => e._id);
    let action = await Action.findOne(query);
    if (!action) return res.status(200).send({ ok: true });

    await action.destroy();

    res.status(200).send({ ok: true });
  })
);

module.exports = router;
