const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { looseUuidRegex, dateRegex } = require("../utils");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const Report = require("../models/report");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const { serializeOrganisation } = require("../utils/data-serializer");
const Service = require("../models/service");

router.post(
  "/team/:team/date/:date",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    try {
      z.object({ count: z.number(), service: z.string().min(1) }).parse(req.body);
      z.object({
        team: z.string().regex(looseUuidRegex),
        date: z.string().regex(dateRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in service count update: ${e}`);
      error.status = 400;
      return next(error);
    }

    const { team, date } = req.params;
    const organisation = req.user.organisation;
    const count = Number(req.body.count);
    const service = String(req.body.service);

    Service.upsert(
      { team, date, service, organisation, count },
      { returning: true, conflictFields: ["service", "date", "team", "organisation"] }
    ).then(([data]) => {
      return res.status(200).send({ ok: true, data });
    });
  })
);

router.get(
  "/team/:team/date/:date",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        team: z.string().regex(looseUuidRegex),
        date: z.string().regex(dateRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in service count get: ${e}`);
      error.status = 400;
      return next(error);
    }

    const { team, date } = req.params;
    const organisation = req.user.organisation;

    Service.findAll({ where: { team, date, organisation } }).then((data) => {
      return res.status(200).send({ ok: true, data });
    });
  })
);

// List sum of services for each day in a specific month.
// This function is used for the month calendar of reports, in order to display bullets.
// [{ date: "2021-01-01", count: 10 }, { date: "2021-01-02", count: 5 }, ...]
router.get(
  "/team/:team/month-stats/:date",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        team: z.string(), // uuid separated via comma.
        date: z.string().regex(dateRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in service count get monthly stats: ${e}`);
      error.status = 400;
      return next(error);
    }

    const { team, date } = req.params;
    const organisation = req.user.organisation;

    const servicesCountByDay = await sequelize.query(
      `select date_trunc('day', "date") as "date", sum("count") as "count" from "mano"."Service" s where date_trunc('month', "date") = :date and team in(:team) and organisation = :organisation group by date_trunc('day', "date")`,
      {
        replacements: { date, team: team.includes(",") ? team.split(",") : [team], organisation },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    return res.status(200).send({ ok: true, data: servicesCountByDay });
  })
);

// List sum for each service in a specific period
// This function is used for stats in stats page.
// [{ service: "service1", count: 10 }, { service: "service2", count: 5 }, ...]
router.get(
  "/team/:team/from/:startDate/to/:endDate",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        team: z.string(), // uuid separated via comma.
        startDate: z.string().regex(dateRegex),
        endDate: z.string().regex(dateRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in service count get monthly stats: ${e}`);
      error.status = 400;
      return next(error);
    }

    const { team, startDate, endDate } = req.params;
    const organisation = req.user.organisation;

    const servicesCountByDay = await sequelize.query(
      `select service, sum("count") as "count" from "mano"."Service" s where date_trunc('day', "date") between :startDate and :endDate and team in(:team) and organisation = :organisation group by service`,
      {
        replacements: { startDate, endDate, team: team.includes(",") ? team.split(",") : [team], organisation },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    return res.status(200).send({ ok: true, data: servicesCountByDay });
  })
);

router.put(
  "/",
  passport.authenticate("user", { session: false }),
  validateEncryptionAndMigrations,
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        reports: z.optional(
          z.array(
            z.object({
              _id: z.string().regex(looseUuidRegex),
              encrypted: z.string(),
              encryptedEntityKey: z.string(),
            })
          )
        ),
        groupedServices: z.array(
          z.object({
            groupTitle: z.string(),
            services: z.array(z.string()),
          })
        ),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in services put: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    try {
      await sequelize.transaction(async (tx) => {
        const { reports = [], groupedServices = [] } = req.body;

        for (let { encrypted, encryptedEntityKey, _id } of reports) {
          await Report.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        organisation.set({ groupedServices });
        await organisation.save({ transaction: tx });
      });
    } catch (e) {
      capture("error updating service", e);
      throw e;
    }
    return res.status(200).send({ ok: true, data: serializeOrganisation(organisation) });
  })
);

module.exports = router;
