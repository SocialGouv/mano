const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const { MedicalFile, Consultation, Treatment, sequelize } = require("../db/sequelize");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");

router.post(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal"], { healthcareProfessional: true }),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in medicalFile creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const data = await MedicalFile.create(
      {
        organisation: req.user.organisation,
        encrypted: req.body.encrypted,
        encryptedEntityKey: req.body.encryptedEntityKey,
      },
      { returning: true }
    );

    return res.status(200).send({
      ok: true,
      data: {
        _id: data._id,
        encrypted: data.encrypted,
        encryptedEntityKey: data.encryptedEntityKey,
        organisation: data.organisation,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        limit: z.optional(z.string().regex(positiveIntegerRegex)),
        page: z.optional(z.string().regex(positiveIntegerRegex)),
        after: z.optional(z.string().regex(positiveIntegerRegex)),
        withDeleted: z.optional(z.enum(["true", "false"])),
      }).parse(req.query);
    } catch (e) {
      const error = new Error(`Invalid request in medicalFile get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await MedicalFile.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await MedicalFile.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "createdAt", "updatedAt", "deletedAt"],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === Number(limit), total });
  })
);

router.put(
  "/documents-reorder",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal"], { healthcareProfessional: true }),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        treatments: z.array(
          z.object({
            _id: z.string().regex(looseUuidRegex),
            encrypted: z.string(),
            encryptedEntityKey: z.string(),
          })
        ),
        consultations: z.array(
          z.object({
            _id: z.string().regex(looseUuidRegex),
            encrypted: z.string(),
            encryptedEntityKey: z.string(),
          })
        ),
        medicalFile: z.object({
          _id: z.string().regex(looseUuidRegex),
          encrypted: z.string(),
          encryptedEntityKey: z.string(),
        }),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in medical document order: ${e}`);
      error.status = 400;
      return next(error);
    }

    await sequelize.transaction(async (t) => {
      for (const treatment of req.body.treatments) {
        const query = { where: { _id: treatment._id, organisation: req.user.organisation } };
        if (!(await Treatment.findOne(query))) {
          const error = new Error(`Treatment not found`);
          error.status = 404;
          throw error;
        }

        const { encrypted, encryptedEntityKey } = treatment;

        const updateTreatment = {
          encrypted: encrypted,
          encryptedEntityKey: encryptedEntityKey,
        };
        await Treatment.update(updateTreatment, query, { silent: false, transaction: t });
      }
      for (const consultation of req.body.consultations) {
        const query = { where: { _id: consultation._id, organisation: req.user.organisation } };
        if (!(await Consultation.findOne(query))) {
          const error = new Error(`Consultation not found`);
          error.status = 404;
          throw error;
        }

        const { encrypted, encryptedEntityKey } = consultation;

        const updateConsultation = {
          encrypted: encrypted,
          encryptedEntityKey: encryptedEntityKey,
        };
        await Consultation.update(updateConsultation, query, { silent: false, transaction: t });
      }
      const query = { where: { _id: req.body.medicalFile._id, organisation: req.user.organisation } };
      if (!(await MedicalFile.findOne(query))) {
        const error = new Error(`MedicalFile not found`);
        error.status = 404;
        throw error;
      }

      const { encrypted, encryptedEntityKey } = req.body.medicalFile;

      const updateMedicalFile = {
        encrypted: encrypted,
        encryptedEntityKey: encryptedEntityKey,
      };
      await MedicalFile.update(updateMedicalFile, query, { silent: false, transaction: t });
    });

    return res.status(200).send({ ok: true });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal"], { healthcareProfessional: true }),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        params: z.object({
          _id: z.string().regex(looseUuidRegex),
        }),
        body: z.object({
          encrypted: z.string(),
          encryptedEntityKey: z.string(),
        }),
      }).parse(req);
    } catch (e) {
      const error = new Error(`Invalid request in medicalFile put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const medicalFile = await MedicalFile.findOne(query);
    if (!medicalFile) return res.status(404).send({ ok: false, error: "Not Found" });

    const { encrypted, encryptedEntityKey } = req.body;

    const updateMedicalFile = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
    };

    await MedicalFile.update(updateMedicalFile, query, { silent: false });
    const newMedicalFile = await MedicalFile.findOne(query);

    return res.status(200).send({
      ok: true,
      data: {
        _id: newMedicalFile._id,
        encrypted: newMedicalFile.encrypted,
        encryptedEntityKey: newMedicalFile.encryptedEntityKey,
        organisation: newMedicalFile.organisation,
        createdAt: newMedicalFile.createdAt,
        updatedAt: newMedicalFile.updatedAt,
        deletedAt: newMedicalFile.deletedAt,
      },
    });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in medicalFile delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    const medicalFile = await MedicalFile.findOne(query);
    if (!medicalFile) return res.status(404).send({ ok: false, error: "Not Found" });

    await medicalFile.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
