const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const { Report, Organisation, sequelize } = require("../db/sequelize");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex } = require("../utils");
const { serializeOrganisation } = require("../utils/data-serializer");

router.put(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        reports: z.optional(
          z.array(
            z.object({
              _id: z.string().regex(looseUuidRegex),
              encrypted: z.string(),
              encryptedEntityKey: z.string(),
            })
          )
        ),
        collaborations: z.array(z.string()),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in category update: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    const { collaborations = [], reports = [] } = req.body;

    await sequelize.transaction(async (tx) => {
      for (let { encrypted, encryptedEntityKey, _id } of reports) {
        await Report.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
      }

      organisation.set({ collaborations });
      await organisation.save({ transaction: tx });
    });
    return res.status(200).send({ ok: true, data: serializeOrganisation(organisation) });
  })
);

module.exports = router;
