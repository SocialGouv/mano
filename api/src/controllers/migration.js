const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const Passage = require("../models/passage");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");
const { looseUuidRegex } = require("../utils");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");

router.put(
  "/:migrationName",
  passport.authenticate("user", { session: false }),
  validateOrganisationEncryption,
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
    if (organisation.migrating) {
      return res
        .status(403)
        .send({ ok: false, error: "Une mise-à-jour de vos données est en cours, veuillez recharger la page dans quelques minutes" });
    }
    if (organisation.migrations?.includes(req.params.migrationName)) {
      return res.status(403).send({ ok: false, error: "Une mise-à-jour de vos données a été effectuée, veuillez recharger votre navigateur" });
    }
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
            ).parse(req.body.passages);
          } catch (e) {
            const error = new Error(`Invalid request in report creation: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const passage of req.body.passages) {
            await Passage.create({
              encrypted: passage.encrypted,
              encryptedEntityKey: passage.encryptedEntityKey,
              organisation: req.user.organisation,
            });
          }
          // for (const _id of req.body.commentIdsToDelete) {
          //   const comment = await Comment.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
          //   if (comment) await comment.destroy();
          // }
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

    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
