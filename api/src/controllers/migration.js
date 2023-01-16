const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const Passage = require("../models/passage");
const Comment = require("../models/comment");
const Report = require("../models/report");
const Person = require("../models/person");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { looseUuidRegex, dateRegex } = require("../utils");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const { serializeOrganisation } = require("../utils/data-serializer");
const Action = require("../models/action");
const Service = require("../models/service");

router.put(
  "/:migrationName",
  passport.authenticate("user", { session: false }),
  validateEncryptionAndMigrations,
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        user: z.object({
          organisation: z.string().regex(looseUuidRegex),
        }),
        params: z.object({
          migrationName: z.string().min(1),
        }),
      }).parse(req);
    } catch (e) {
      const error = new Error(`Invalid request in migration: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });
    organisation.set({ migrating: true });
    await organisation.save();

    try {
      await sequelize.transaction(async (tx) => {
        if (req.params.migrationName === "reports-from-real-date-to-date-id") {
          try {
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.reportsToMigrate);
          } catch (e) {
            const error = new Error(`Invalid request in reports-from-real-date-to-date-id migration: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const { _id, encrypted, encryptedEntityKey } of req.body.reportsToMigrate) {
            const report = await Report.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (report) {
              report.set({ encrypted, encryptedEntityKey });
              await report.save();
            }
          }
        }

        if (req.params.migrationName === "clean-reports-with-no-team-nor-date") {
          try {
            z.array(z.string().regex(looseUuidRegex)).parse(req.body.reportIdsToDelete);
          } catch (e) {
            const error = new Error(`Invalid request in reports-from-real-date-to-date-id migration: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const _id of req.body.reportIdsToDelete) {
            await Report.destroy({ where: { _id, organisation: req.user.organisation }, transaction: tx });
          }
        }

        if (req.params.migrationName === "clean-duplicated-reports-4") {
          try {
            z.object({
              reportIdsToDelete: z.array(z.string().regex(looseUuidRegex)),
              consolidatedReports: z.array(
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  encrypted: z.string(),
                  encryptedEntityKey: z.string(),
                })
              ),
            }).parse(req.body);
          } catch (e) {
            const error = new Error(`Invalid request in clean-duplicated-reports-4: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const { _id, encrypted, encryptedEntityKey } of req.body.consolidatedReports) {
            const report = await Report.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (report) {
              report.set({ encrypted, encryptedEntityKey });
              await report.save();
            }
          }
          for (const _id of req.body.reportIdsToDelete) {
            await Report.destroy({ where: { _id, organisation: req.user.organisation }, transaction: tx });
          }
        }
        if (req.params.migrationName === "update-outOfActiveListReason-and-healthInsurances-to-multi-choice") {
          try {
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.personsToUpdate);
          } catch (e) {
            const error = new Error(`Invalid request in reports-from-real-date-to-date-id migration: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const { _id, encrypted, encryptedEntityKey } of req.body.personsToUpdate) {
            const person = await Person.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (person) {
              person.set({ encrypted, encryptedEntityKey });
              await person.save();
            }
          }

          if (Array.isArray(organisation?.fieldsPersonsCustomizableOptions)) {
            organisation.set({
              fieldsPersonsCustomizableOptions: organisation?.fieldsPersonsCustomizableOptions.map((field) => {
                if (field.name !== "outOfActiveListReason") return field;
                return {
                  name: "outOfActiveListReasons",
                  type: "multi-choice",
                  label: "Motif(s) de sortie de file active",
                  options: field.options,
                  showInStats: true,
                  enabled: true,
                };
              }),
            });
          }
          await organisation.save({ transaction: tx });
        }
        if (req.params.migrationName === "action-with-multiple-team") {
          try {
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.actionsToUpdate);
          } catch (e) {
            const error = new Error(`Invalid request in action-with-multiple-team migration: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const { _id, encrypted, encryptedEntityKey } of req.body.actionsToUpdate) {
            const action = await Action.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (action) {
              action.set({ encrypted, encryptedEntityKey });
              await action.save();
            }
          }
        }

        if (req.params.migrationName === "services-in-services-table") {
          try {
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.reportsToUpdate);
            z.array(
              z.object({
                team: z.string().regex(looseUuidRegex),
                date: z.string().regex(dateRegex),
                service: z.string(),
                count: z.number(),
              })
            ).parse(req.body.servicesToSaveInDB);
          } catch (e) {
            const error = new Error(`Invalid request in services-in-services-table migration: ${e}`);
            error.status = 400;
            throw error;
          }
          const servicesToSaveInDB = [...req.body.servicesToSaveInDB];

          // Update services that already exists (when there is both a service and a report for the same date)
          const servicesInDB = await Service.findAll({
            where: { organisation: req.user.organisation, date },
            transaction: tx,
          });
          for (const serviceInDB of servicesInDB) {
            const index = servicesToSaveInDB.findIndex(
              (service) => service.service === serviceInDB.service && service.date === serviceInDB.date && service.team === serviceInDB.team
            );
            if (index !== -1) {
              const service = servicesToSaveInDB[index];
              serviceInDB.set({ count: service.count + serviceInDB.count });
              await serviceInDB.save();
              servicesToSaveInDB.splice(index, 1);
            }
          }

          await Service.bulkCreate(servicesToSaveInDB.map((service) => ({ ...service, organisation: req.user.organisation }, { transaction: tx })));
          for (const { _id, encrypted, encryptedEntityKey } of req.body.reportsToUpdate) {
            const report = await Report.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (report) {
              report.set({ encrypted, encryptedEntityKey });
              await report.save();
            }
          }
        }

        organisation.set({
          migrations: [...(organisation.migrations || []), req.params.migrationName],
          migrating: false,
          migrationLastUpdateAt: new Date(),
        });
        await organisation.save({ transaction: tx });
      });
    } catch (e) {
      capture("error migrating", e);
      organisation.set({ migrating: false });
      await organisation.save();
      return next(e);
    }
    return res.status(200).send({
      ok: true,
      organisation: serializeOrganisation(organisation),
    });
  })
);

module.exports = router;
