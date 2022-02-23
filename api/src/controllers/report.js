const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");

const { catchErrors } = require("../errors");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");

const Report = require("../models/report");

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        organisation: req.user.organisation,
      },
    };

    const attributes = [
      // Generic fields
      "_id",
      "encrypted",
      "encryptedEntityKey",
      "organisation",
      "createdAt",
      "updatedAt",
    ];

    if (req.query.lastRefresh) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(req.query.lastRefresh)) };
      const data = await Report.findAll({ ...query, attributes });
      return res.status(200).send({ ok: true, data });
    }

    const total = await Report.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await Report.findAll({ ...query, attributes });

    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const { team, date } = req.body;

    // Todo: ignore fields that are encrypted.
    if (!team) return res.status(400).send({ ok: false, error: "Team is required" });
    if (!date) return res.status(400).send({ ok: false, error: "Date is required" });
    if (req.user.role !== "admin" && !req.user.teams.map((t) => t._id).includes(req.body.team)) {
      capture("not permission creating report", { user: req.user });
      return res.send(403).send({ ok: false, error: "not permission creating report" });
    }

    // Todo: this will not work as is anymore if we remove fields.
    // We should update all reports with an "ID" which is its date.
    const existingReport = await Report.findOne({ where: { team, date, organisation: req.user.organisation } });
    if (existingReport) return res.status(200).send({ ok: true, data: existingReport });

    const data = await Report.create({ team, date, organisation: req.user.organisation });
    return res.status(200).send({ ok: true, data });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateOrganisationEncryption,
  catchErrors(async (req, res) => {
    const where = { _id: req.params._id };
    if (req.user.role !== "admin") where.team = req.user.teams.map((e) => e._id);

    const report = await Report.findOne({ where });
    if (!report) return res.status(404).send({ ok: false, error: "Not Found" });

    const updatedReport = {};
    // Todo: ignore fields that are encrypted.
    if (req.body.hasOwnProperty("description")) updatedReport.description = req.body.description || null;
    if (req.body.hasOwnProperty("collaborations")) updatedReport.collaborations = req.body.collaborations || [];
    if (req.body.hasOwnProperty("passages")) updatedReport.passages = req.body.passages || null;
    if (req.body.hasOwnProperty("services")) updatedReport.services = req.body.services || null;
    if (req.body.hasOwnProperty("encrypted")) updatedReport.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updatedReport.encryptedEntityKey = req.body.encryptedEntityKey || null;

    report.set(updatedReport);
    await report.save();
    return res.status(200).send({ ok: true, data: report });
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
