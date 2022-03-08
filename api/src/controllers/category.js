const express = require("express");
const router = express.Router();
const passport = require("passport");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const Action = require("../models/action");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");

router.put(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  validateOrganisationEncryption,
  catchErrors(async (req, res) => {
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
