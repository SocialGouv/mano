const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const { TerritoryObservation, Organisation, Person, Consultation, MedicalFile, sequelize } = require("../db/sequelize");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex, customFieldSchema } = require("../utils");
const { serializeOrganisation } = require("../utils/data-serializer");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    const collectionNames = ["consultations", "medicalFiles", "persons", "observations"];
    for (const objectKey of collectionNames) {
      try {
        z.array(
          z.object({
            _id: z.string().regex(looseUuidRegex),
            encrypted: z.string(),
            encryptedEntityKey: z.string(),
          })
        )
          .optional()
          .parse(req.body[objectKey]);
      } catch (e) {
        const error = new Error(`Invalid request in custom-field objectKey ${objectKey}: ${e}`);
        error.status = 400;
        return next(error);
      }
    }
    try {
      z.object({
        customFieldsObs: z.optional(z.array(customFieldSchema)),
        fieldsPersonsCustomizableOptions: z.optional(z.array(customFieldSchema)),
        customFieldsMedicalFile: z.optional(z.array(customFieldSchema)),
        customFieldsPersons: z.optional(
          z.array(
            z.object({
              name: z.string().min(1),
              fields: z.array(customFieldSchema),
            })
          )
        ),
        consultations: z.optional(
          z.array(
            z.object({
              name: z.string().min(1),
              fields: z.array(customFieldSchema),
            })
          )
        ),
      }).parse(req.body.customFields);
    } catch (e) {
      const error = new Error(`Invalid request in customFields put in custom-field: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });

    try {
      await sequelize.transaction(async (tx) => {
        const { consultations = [], medicalFiles = [], persons = [], observations = [] } = req.body;

        for (let { encrypted, encryptedEntityKey, _id } of persons) {
          await Person.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        for (let { encrypted, encryptedEntityKey, _id } of consultations) {
          await Consultation.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        for (let { encrypted, encryptedEntityKey, _id } of medicalFiles) {
          await MedicalFile.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        for (let { encrypted, encryptedEntityKey, _id } of observations) {
          await TerritoryObservation.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        const updateOrg = {};
        const customFields = req.body.customFields;
        if (customFields.hasOwnProperty("customFieldsObs"))
          updateOrg.customFieldsObs =
            typeof customFields.customFieldsObs === "string" ? JSON.parse(customFields.customFieldsObs) : customFields.customFieldsObs;
        if (customFields.hasOwnProperty("fieldsPersonsCustomizableOptions"))
          updateOrg.fieldsPersonsCustomizableOptions =
            typeof customFields.fieldsPersonsCustomizableOptions === "string"
              ? JSON.parse(customFields.fieldsPersonsCustomizableOptions)
              : customFields.fieldsPersonsCustomizableOptions;
        if (customFields.hasOwnProperty("customFieldsMedicalFile"))
          updateOrg.customFieldsMedicalFile =
            typeof customFields.customFieldsMedicalFile === "string"
              ? JSON.parse(customFields.customFieldsMedicalFile)
              : customFields.customFieldsMedicalFile;
        if (customFields.hasOwnProperty("customFieldsPersons"))
          updateOrg.customFieldsPersons =
            typeof customFields.customFieldsPersons === "string" ? JSON.parse(customFields.customFieldsPersons) : customFields.customFieldsPersons;
        if (customFields.hasOwnProperty("consultations"))
          updateOrg.consultations =
            typeof customFields.consultations === "string" ? JSON.parse(customFields.consultations) : customFields.consultations;

        organisation.set(updateOrg);
        await organisation.save({ transaction: tx });
      });
    } catch (e) {
      capture("error updating custom-field choice", e);
      throw e;
    }

    return res.status(200).send({ ok: true, data: serializeOrganisation(organisation) });
  })
);

module.exports = router;
