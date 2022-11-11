const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const Action = require("../models/action");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex } = require("../utils");

router.put(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        actions: z.optional(
          z.array(
            z.object({
              _id: z.string().regex(looseUuidRegex),
              encrypted: z.string(),
              encryptedEntityKey: z.string(),
            })
          )
        ),
        actionsGroupedCategories: z.array(
          z.object({
            groupTitle: z.string(),
            categories: z.array(z.string()),
          })
        ),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in category update: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    const { actions = [], actionsGroupedCategories = [] } = req.body;

    await sequelize.transaction(async (tx) => {
      for (let { encrypted, encryptedEntityKey, _id } of actions) {
        await Action.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
      }

      organisation.set({ actionsGroupedCategories });
      await organisation.save({ transaction: tx });
    });
    return res.status(200).send({ ok: true, data: organisation });
  })
);

module.exports = router;
