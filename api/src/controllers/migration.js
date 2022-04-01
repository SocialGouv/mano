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
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { looseUuidRegex } = require("../utils");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const Territory = require("../models/territory");

router.put(
  "/:migrationName",
  passport.authenticate("user", { session: false }),
  validateEncryptionAndMigrations,
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.user.organisation);
      z.string().min(1).parse(req.params.migrationName);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });
    organisation.set({ migrating: true });
    await organisation.save();

    try {
      await sequelize.transaction(async (tx) => {
        // Each migration has its own "if". This is an example.
        if (req.params.migrationName === "passages-from-comments-to-table") {
          try {
            z.array(z.string().regex(looseUuidRegex)).parse(req.body.commentIdsToDelete);
            z.array(
              z.object({
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.newPassages);
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.reportsToMigrate);
          } catch (e) {
            const error = new Error(`Invalid request in report creation: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const passage of req.body.newPassages) {
            await Passage.create({
              encrypted: passage.encrypted,
              encryptedEntityKey: passage.encryptedEntityKey,
              organisation: req.user.organisation,
            });
          }
          for (const _id of req.body.commentIdsToDelete) {
            const comment = await Comment.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (comment) await comment.destroy();
          }
          for (const { _id, encrypted, encryptedEntityKey } of req.body.reportsToMigrate) {
            const report = await Report.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (report) {
              report.set({ encrypted, encryptedEntityKey });
              await report.save();
            }
          }
        }

        if (req.params.migrationName === "territory-observations-in-territories") {
          try {
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.territoriesToUpdate);
          } catch (e) {
            const error = new Error(`Invalid request in territories update: ${e}`);
            error.status = 400;
            throw error;
          }

          for (const { _id, encrypted, encryptedEntityKey } of req.body.territoriesToUpdate) {
            const territory = await Territory.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (territory) {
              territory.set({ encrypted, encryptedEntityKey });
              await territory.save();
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
      throw e;
    }
    return res.status(200).send({
      ok: true,
      organisation: {
        _id: organisation._id,
        name: organisation.name,
        createdAt: organisation.createdAt,
        updatedAt: organisation.updatedAt,
        categories: organisation.categories,
        encryptionEnabled: organisation.encryptionEnabled,
        encryptionLastUpdateAt: organisation.encryptionLastUpdateAt,
        receptionEnabled: organisation.receptionEnabled,
        services: organisation.services,
        consultations: organisation.consultations,
        collaborations: organisation.collaborations,
        customFieldsObs: organisation.customFieldsObs,
        encryptedVerificationKey: organisation.encryptedVerificationKey,
        customFieldsPersonsSocial: organisation.customFieldsPersonsSocial,
        customFieldsPersonsMedical: organisation.customFieldsPersonsMedical,
        migrations: organisation.migrations,
        migrationLastUpdateAt: organisation.migrationLastUpdateAt,
      },
    });
  })
);

module.exports = router;
