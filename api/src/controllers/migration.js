const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");
const { looseUuidRegex } = require("../utils");
const { capture } = require("../sentry");

router.put(
  "/:migrationName",
  passport.authenticate("user", { session: false }),
  validateOrganisationEncryption,
  catchErrors(async (req, res) => {
    try {
      z.literal("admin").parse(req.user.role);
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
    organisation.set({ migrating: true });
    await organisation.save();

    try {
      await sequelize.transaction(async (tx) => {
        // Each migration has its own "if". This is an example.
        if (req.params.migrationName === "passages-from-comments-to-table") {
          try {
            z.array(z.string().regex(looseUuidRegex)).parse(req.body.commentIds);
          } catch (e) {
            return res.status(400).send({ ok: false, error: "Invalid request" });
          }
          for (const _id of actions) {
            const comment = await Comment.findOne({ where: { _id, organisation: req.user.organisation }, transaction: tx });
            if (comment) await comment.destroy();
          }
        }

        organisation.set({ migrations: [...organisation.migrations, req.params.migrationName] });
        await organisation.save({ transaction: tx, migrating: false });
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
