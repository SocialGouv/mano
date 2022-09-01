const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const Person = require("../models/person");
const RelPersonPlace = require("../models/relPersonPlace");
const Action = require("../models/action");
const Consultation = require("../models/consultation");
const Treatment = require("../models/treatment");
const MedicalFile = require("../models/medicalFile");
const Comment = require("../models/comment");
const Passage = require("../models/passage");
const sequelize = require("../db/sequelize");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex } = require("../utils");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");

router.post(
  "/persons",
  passport.authenticate("user", { session: false }),
  validateEncryptionAndMigrations,
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    const arraysOfEncryptedItems = [
      "mergedActions",
      "mergedConsultations",
      "mergedTreatments",
      "mergedPassages",
      "mergedComments",
      "mergedRelsPersonPlace",
    ];
    for (const key of arraysOfEncryptedItems) {
      try {
        z.array(
          z.object({
            _id: z.string().regex(looseUuidRegex),
            encrypted: z.string(),
            encryptedEntityKey: z.string(),
          })
        ).parse(req.body[key]);
      } catch (e) {
        const error = new Error(`Invalid request in merge two persons ${key}: ${e}`);
        error.status = 400;
        return next(error);
      }
    }
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
      }).parse(req.body.mergedPerson);
    } catch (e) {
      const error = new Error(`Invalid request in merge two persons mergedPerson: ${e}`);
      error.status = 400;
      return next(error);
    }
    try {
      z.optional(
        z.object({
          _id: z.string().regex(looseUuidRegex),
          encrypted: z.string(),
          encryptedEntityKey: z.string(),
        })
      ).parse(req.body.mergedMedicalFile);
    } catch (e) {
      const error = new Error(`Invalid request in merge two persons mergedMedicalFile: ${e}`);
      error.status = 400;
      return next(error);
    }

    try {
      z.string().regex(looseUuidRegex).parse(req.body.personToDeleteId);
      z.optional(z.string().regex(looseUuidRegex)).parse(req.body.medicalFileToDeleteId);
    } catch (e) {
      const error = new Error(`Invalid request in merge two persons personToDeleteId: ${e}`);
      error.status = 400;
      return next(error);
    }

    await sequelize.transaction(async (tx) => {
      const {
        mergedPerson,
        mergedActions,
        mergedConsultations,
        mergedTreatments,
        mergedMedicalFile,
        mergedComments,
        mergedPassages,
        mergedRelsPersonPlace,
        personToDeleteId,
        medicalFileToDeleteId,
      } = req.body;

      for (let { encrypted, encryptedEntityKey, _id } of [mergedPerson]) {
        await Person.update({ encrypted, encryptedEntityKey }, { where: { _id, organisation: req.user.organisation }, transaction: tx });
      }

      for (let { encrypted, encryptedEntityKey, _id } of mergedActions) {
        await Action.update({ encrypted, encryptedEntityKey }, { where: { _id, organisation: req.user.organisation }, transaction: tx });
      }

      for (let { encrypted, encryptedEntityKey, _id } of mergedConsultations) {
        await Consultation.update({ encrypted, encryptedEntityKey }, { where: { _id, organisation: req.user.organisation }, transaction: tx });
      }

      for (let { encrypted, encryptedEntityKey, _id } of mergedTreatments) {
        await Treatment.update({ encrypted, encryptedEntityKey }, { where: { _id, organisation: req.user.organisation }, transaction: tx });
      }

      if (mergedMedicalFile) {
        for (let { encrypted, encryptedEntityKey, _id } of [mergedMedicalFile]) {
          await MedicalFile.update({ encrypted, encryptedEntityKey }, { where: { _id, organisation: req.user.organisation }, transaction: tx });
        }
      }

      for (let { encrypted, encryptedEntityKey, _id } of mergedComments) {
        await Comment.update({ encrypted, encryptedEntityKey }, { where: { _id, organisation: req.user.organisation }, transaction: tx });
      }

      for (let { encrypted, encryptedEntityKey, _id } of mergedPassages) {
        await Passage.update({ encrypted, encryptedEntityKey }, { where: { _id, organisation: req.user.organisation }, transaction: tx });
      }

      for (let { encrypted, encryptedEntityKey, _id } of mergedRelsPersonPlace) {
        await RelPersonPlace.update({ encrypted, encryptedEntityKey }, { where: { _id, organisation: req.user.organisation }, transaction: tx });
      }

      let person = await Person.findOne({ where: { _id: personToDeleteId, organisation: req.user.organisation } });
      if (person) await person.destroy({ transaction: tx });

      if (medicalFileToDeleteId) {
        let medicalFile = await MedicalFile.findOne({ where: { _id: medicalFileToDeleteId, organisation: req.user.organisation } });
        await medicalFile.destroy({ transaction: tx });
      }
    });

    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
