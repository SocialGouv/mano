const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex, customFieldSchema } = require("../utils");
const Person = require("../models/person");

router.put(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.array(
        z.object({
          _id: z.string().regex(looseUuidRegex),
          encrypted: z.string(),
          encryptedEntityKey: z.string(),
        })
      ).parse(req.body.persons);
      z.optional(
        z.array(
          z.object({
            name: z.string().min(1),
            fields: z.array(customFieldSchema),
          })
        )
      ).parse(req.body.consultations);
    } catch (e) {
      const error = new Error(`Invalid request in consultation update: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    const { persons = [], consulations = [] } = req.body;

    try {
      await sequelize.transaction(async (tx) => {
        for (let { encrypted, encryptedEntityKey, _id } of persons) {
          await Person.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        organisation.set({ consulations });
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
