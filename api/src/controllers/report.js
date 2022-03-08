const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { catchErrors } = require("../errors");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");
const validateUser = require("../middleware/validateUser");
const Report = require("../models/report");

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
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
  validateUser(["admin", "normal"]),
  validateOrganisationEncryption,
  catchErrors(async (req, res, next) => {
    const newReport = { organisation: req.user.organisation };

    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in report create");
    }

    if (req.body.hasOwnProperty("encrypted")) newReport.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newReport.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const reportData = await Report.create(newReport, { returning: true });

    return res.status(200).send({ ok: true, data: reportData });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  validateOrganisationEncryption,
  catchErrors(async (req, res, next) => {
    const where = { _id: req.params._id };

    const report = await Report.findOne({ where });
    if (!report) return res.status(404).send({ ok: false, error: "Not Found" });

    const updatedReport = {};
    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in report update");
    }

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
  validateUser(["admin", "normal"]),
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
