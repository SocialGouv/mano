const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const MedicalFile = require("../models/medicalFile");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"], { healthcareProfessional: true }),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
      z.string().regex(looseUuidRegex).parse(req.body.person);
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
        person: req.body.person,
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
        person: data.person,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"], { healthcareProfessional: true }),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.limit);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.page);
      z.optional(z.enum(["true", "false"])).parse(req.query.withDeleted);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.after);
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
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "person", "createdAt", "updatedAt", "deletedAt"],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === Number(limit), total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"], { healthcareProfessional: true }),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
      z.string().regex(looseUuidRegex).parse(req.body.person);
    } catch (e) {
      const error = new Error(`Invalid request in medicalFile put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const medicalFile = await MedicalFile.findOne(query);
    if (!medicalFile) return res.status(404).send({ ok: false, error: "Not Found" });

    const { encrypted, encryptedEntityKey, person } = req.body;

    const updateMedicalFile = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
      person: person,
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
        person: newMedicalFile.person,
        createdAt: newMedicalFile.createdAt,
        updatedAt: newMedicalFile.updatedAt,
        deletedAt: newMedicalFile.deletedAt,
      },
    });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"], { healthcareProfessional: true }),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      const error = new Error(`Invalid request in medicalFile delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    const medicalFile = await MedicalFile.findOne(query);
    if (!medicalFile) return res.status(200).send({ ok: true });

    await medicalFile.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
