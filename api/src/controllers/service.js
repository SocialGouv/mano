const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { Op } = require("sequelize");
const { looseUuidRegex, dateRegex } = require("../utils");
const { catchErrors } = require("../errors");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const { serializeOrganisation } = require("../utils/data-serializer");
const { Organisation, Service, sequelize } = require("../db/sequelize");

router.post(
  "/team/:team/date/:date",
  passport.authenticate("user", { session: false, failWithError: true }),
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
  passport.authenticate("user", { session: false, failWithError: true }),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        team: z.string().regex(looseUuidRegex),
        date: z.string().regex(dateRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in /team/:team/date/:date: ${e}`);
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

router.get(
  "/for-reports",
  passport.authenticate("user", { session: false, failWithError: true }),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        teamIds: z.string().transform((val) => val.split(",").map((id) => z.string().regex(looseUuidRegex).parse(id))),
        startDate: z.string().regex(dateRegex),
        endDate: z.string().regex(dateRegex),
      }).parse(req.query);
    } catch (e) {
      const error = new Error(`Invalid request in service for-reports: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = req.user.organisation;

    Service.findAll({
      where: {
        team: {
          [Op.in]: req.query.teamIds.split(","),
        },
        date: {
          // between is inclusive.
          [Op.between]: [req.query.startDate, req.query.endDate],
        },
        organisation,
      },
    }).then((data) => {
      const allServicesMergedByTeam = {};
      for (const serviceRow of data) {
        allServicesMergedByTeam[serviceRow.team] = allServicesMergedByTeam[serviceRow.team] || {};
        allServicesMergedByTeam[serviceRow.team][serviceRow.service] =
          (allServicesMergedByTeam[serviceRow.team][serviceRow.service] || 0) + serviceRow.count;
      }
      return res.status(200).send({ ok: true, data: allServicesMergedByTeam });
    });
  })
);

router.get(
  "/all",
  passport.authenticate("user", { session: false, failWithError: true }),
  catchErrors(async (req, res) => {
    const services = await Service.findAll({ where: { organisation: req.user.organisation } });

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });

    const groupedServices = organisation.groupedServices || [];
    const servicesIndexedByGroup = {};
    for (const group of groupedServices) {
      for (const service of group.services) {
        servicesIndexedByGroup[service] = group.groupTitle;
      }
    }

    const servicesWithGroups = services.map((serviceRow) => ({
      ...serviceRow.dataValues,
      group: servicesIndexedByGroup[serviceRow.dataValues.service],
    }));

    return res.status(200).send({ ok: true, data: servicesWithGroups });
  })
);

// List sum of services for each day in a specific month.
// This function is used for the month calendar of reports, in order to display bullets.
// [{ date: "2021-01-01", count: 10 }, { date: "2021-01-02", count: 5 }, ...]
router.get(
  "/team/:team/month-stats/:date",
  passport.authenticate("user", { session: false, failWithError: true }),
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
  "/team/:team/stats",
  passport.authenticate("user", { session: false, failWithError: true }),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        team: z.string(), // uuid separated via comma.
      }).parse(req.params);
      z.object({
        from: z.optional(z.string().regex(dateRegex)),
        to: z.optional(z.string().regex(dateRegex)),
      }).parse(req.query);
    } catch (e) {
      const error = new Error(`Invalid request in service /team/:team/stats: ${e}`);
      error.status = 400;
      return next(error);
    }

    const { team } = req.params;
    const { from, to } = req.query;
    const organisation = req.user.organisation;

    let servicesCountByDay;
    if (from) {
      servicesCountByDay = await sequelize.query(
        `select service, sum("count") as "count" from "mano"."Service" s where date_trunc('day', "date") between :from and :to and team in(:team) and organisation = :organisation group by service`,
        {
          replacements: { from, to: to || from, team: team.includes(",") ? team.split(",") : [team], organisation },
          type: sequelize.QueryTypes.SELECT,
        }
      );
    } else {
      servicesCountByDay = await sequelize.query(
        `select service, sum("count") as "count" from "mano"."Service" s where team in(:team) and organisation = :organisation group by service`,
        {
          replacements: { team: team.includes(",") ? team.split(",") : [team], organisation },
          type: sequelize.QueryTypes.SELECT,
        }
      );
    }

    return res.status(200).send({ ok: true, data: servicesCountByDay });
  })
);

// Update service name (from old to new)
router.put(
  "/update-service-name",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        oldService: z.string(),
        newService: z.string(),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in service update-service-name: ${e}`);
      error.status = 400;
      return next(error);
    }

    const { oldService, newService } = req.body;
    const organisation = req.user.organisation;

    await Service.update({ service: newService }, { where: { service: oldService, organisation } });

    return res.status(200).send({ ok: true });
  })
);

// Update service configuration
router.put(
  "/update-configuration",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateEncryptionAndMigrations,
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
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
      const { groupedServices = [] } = req.body;
      organisation.set({ groupedServices });
      await organisation.save();
    } catch (e) {
      capture("error updating service", e);
      throw e;
    }
    return res.status(200).send({ ok: true, data: serializeOrganisation(organisation) });
  })
);

module.exports = router;
