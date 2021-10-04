const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op, where, fn, col } = require("sequelize");

const { catchErrors } = require("../errors");

const Report = require("../models/report");
const encryptedTransaction = require("../utils/encryptedTransaction");

//checked
router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        organisation: req.user.organisation,
      },
      order: [["date", "DESC"]],
    };

    if (req.query.lastRefresh) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(req.query.lastRefresh)) };
      const data = await Comment.findAll(query);
      return res.status(200).send({ ok: true, data });
    }

    const total = await Report.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await Report.findAll(query);

    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

//checked
router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const { team, date } = req.body;

    if (!team) return res.status(400).send({ ok: false, error: "Team is required" });
    if (!date) return res.status(400).send({ ok: false, error: "Date is required" });
    if (req.user.role !== "admin" && !req.user.teams.map((t) => t._id).includes(req.body.team)) {
      throw new Error("not permission creating report");
    }

    const data = await Report.create({ team, date, organisation: req.user.organisation });
    return res.status(200).send({ ok: true, data });
  })
);

//checked
router.get(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const where = { _id: req.params._id };
    if (req.user.role !== "admin") where.team = req.user.teams.map((e) => e._id);

    const data = await Report.findOne({ where });
    if (!data) return res.status(404).send({ ok: false, error: "Not Found" });

    return res.status(200).send({ ok: true, data });
  })
);

//checked
router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const where = { _id: req.params._id };
    if (req.user.role !== "admin") where.team = req.user.teams.map((e) => e._id);

    const report = await Report.findOne({ where });
    if (!report) return res.status(404).send({ ok: false, error: "Not Found" });

    const updatedReport = {};
    if (req.body.hasOwnProperty("description")) updatedReport.description = req.body.description || null;
    if (req.body.hasOwnProperty("collaboration")) updatedReport.collaboration = req.body.collaboration || null;
    if (req.body.hasOwnProperty("passages")) updatedReport.passages = req.body.passages || null;
    if (req.body.hasOwnProperty("services")) updatedReport.services = req.body.services || null;

    if (req.body.hasOwnProperty("encrypted")) updatedReport.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updatedReport.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      report.set(updatedReport);
      await report.save({ transaction: tx });
      return report;
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

    const report = await Report.findOne(query);
    if (!report) return res.status(200).send({ ok: true });

    await report.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
