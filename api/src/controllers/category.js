const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const Action = require("../models/action");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");
const { looseUuidRegex } = require("../utils");
const { capture } = require("../sentry");

router.put(
  "/",
  passport.authenticate("user", { session: false }),
  validateOrganisationEncryption,
  catchErrors(async (req, res) => {
    try {
      z.literal("admin").parse(req.user.role);
      z.string().regex(looseUuidRegex).parse(req.user.organisation);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }

    const query = { where: { _id: req.user.organisation } };
    const organisation = await Organisation.findOne(query);
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    try {
      await sequelize.transaction(async (tx) => {
        const { actions = [] } = req.body;

        for (let { encrypted, encryptedEntityKey, _id } of actions) {
          await Action.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        organisation.set({ categories: req.body.categories });
        await organisation.save({ transaction: tx });
      });
    } catch (e) {
      capture("error updating category", e);
      throw e;
    }
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
