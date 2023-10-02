const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { looseUuidRegex, dateRegex } = require("../utils");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const { serializeOrganisation } = require("../utils/data-serializer");
const { Organisation, Person, Action, Comment, Report, Team, Service, sequelize, Group } = require("../db/sequelize");

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
        /*
        // Example of migration:
        if (req.params.migrationName === "migration-name") {
          try {
            z.array(z.string().regex(looseUuidRegex)).parse(req.body.thingsIdsToDestroy);
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.thingsToUpdate);
          } catch (e) {
            const error = new Error(`Invalid request in migration-name: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const _id of req.body.thingsIdsToDestroy) {
            await Thing.destroy({ where: { _id, organisation: req.user.organisation }, transaction: tx });
          }
          for (const { _id, encrypted, encryptedEntityKey } of req.body.thingsToUpdate) {
            await Thing.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
          }
        }
        // End of example of migration.
         */

        if (req.params.migrationName === "integrate-comments-in-actions-history") {
          try {
            z.array(z.string().regex(looseUuidRegex)).parse(req.body.commentIdsToDelete);
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.actionsToUpdate);
          } catch (e) {
            const error = new Error(`Invalid request in reports-from-real-date-to-date-id migration: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const _id of req.body.commentIdsToDelete) {
            await Comment.destroy({ where: { _id, organisation: req.user.organisation }, transaction: tx });
          }
          for (const { _id, encrypted, encryptedEntityKey } of req.body.actionsToUpdate) {
            await Action.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
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
