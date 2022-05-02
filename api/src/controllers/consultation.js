const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { Op } = require("sequelize");
const sequelize = require("../db/sequelize");
const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const Consultation = require("../models/consultation");
const { looseUuidRegex, customFieldSchema, positiveIntegerRegex } = require("../utils");

const TODO = "A FAIRE";
const DONE = "FAIT";
const CANCEL = "ANNULEE";
const STATUS = [TODO, DONE, CANCEL];

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"], { healthcareProfessional: true }),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.enum(STATUS).parse(req.body.status);
      z.preprocess((input) => new Date(input), z.date()).parse(req.body.dueAt);
      if (req.body.completedAt) z.preprocess((input) => new Date(input), z.date()).parse(req.body.completedAt);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
      z.array(z.string().regex(looseUuidRegex)).parse(req.body.onlyVisibleBy);
    } catch (e) {
      const error = new Error(`Invalid request in consultation creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const { status, dueAt, completedAt, encrypted, encryptedEntityKey, onlyVisibleBy } = req.body;
    const consultation = {
      organisation: req.user.organisation,
      status,
      dueAt,
      completedAt: completedAt || null,
      onlyVisibleBy,
      encrypted,
      encryptedEntityKey,
    };

    const data = await Consultation.create(consultation, { returning: true });
    return res.status(200).send({
      ok: true,
      data: {
        _id: data._id,
        encrypted: data.encrypted,
        encryptedEntityKey: data.encryptedEntityKey,
        onlyVisibleBy: data.onlyVisibleBy,
        organisation: data.organisation,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
        status: data.status,
        dueAt: data.dueAt,
        completedAt: data.completedAt,
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.limit);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.page);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.lastRefresh);
      z.optional(z.enum(["true", "false"])).parse(req.query.withDeleted);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.after);
    } catch (e) {
      const error = new Error(`Invalid request in consultation get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, lastRefresh, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [
        ["status", "ASC"],
        ["dueAt", "ASC"],
        ["createdAt", "ASC"],
      ],
    };

    const total = await Consultation.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (lastRefresh) {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(lastRefresh)) } }];
    }
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const sortDoneOrCancel = (a, b) => {
      if (!a.dueAt) return -1;
      if (!b.dueAt) return 1;
      if (a.dueAt > b.dueAt) return -1;
      return 1;
    };

    let consultations = await Consultation.findAll({
      ...query,
      attributes: [
        // Generic fields
        "_id",
        "encrypted",
        "encryptedEntityKey",
        "organisation",
        "createdAt",
        "updatedAt",
        "deletedAt",
        // Specific fields that are not encrypted
        "status",
        "dueAt",
        "completedAt",
        // All other fields are encrypted and should not be returned.
      ],
    });
    const todo = consultations.filter((a) => a.status === TODO);
    const done = consultations.filter((a) => a.status === DONE).sort(sortDoneOrCancel);
    const cancel = consultations.filter((a) => a.status === CANCEL).sort(sortDoneOrCancel);
    const data = [...todo, ...done, ...cancel];
    return res.status(200).send({
      ok: true,
      data: data.map((consultation) => ({
        _id: consultation._id,
        encrypted: consultation.encrypted,
        encryptedEntityKey: consultation.encryptedEntityKey,
        onlyVisibleBy: consultation.onlyVisibleBy,
        organisation: consultation.organisation,
        createdAt: consultation.createdAt,
        updatedAt: consultation.updatedAt,
        deletedAt: consultation.deletedAt,
        status: consultation.status,
        dueAt: consultation.dueAt,
        completedAt: consultation.completedAt,
      })),
      hasMore: data.length === Number(limit),
      total,
    });
  })
);

router.put(
  "/model",
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
      ).parse(req.body.consultations);
      z.optional(
        z.array(
          z.object({
            name: z.string().min(1),
            fields: z.array(customFieldSchema),
          })
        )
      ).parse(req.body.organisationsConsultations);
    } catch (e) {
      const error = new Error(`Invalid request in consultation update: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    const { consultations = [], organisationsConsultations = [] } = req.body;

    try {
      await sequelize.transaction(async (tx) => {
        for (const { encrypted, encryptedEntityKey, _id } of consultations) {
          await Consultation.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
        }

        organisation.set({ consulations: organisationsConsultations });
        await organisation.save({ transaction: tx });
      });
    } catch (e) {
      capture("error updating consultation", e);
      throw e;
    }
    return res.status(200).send({ ok: true });
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
      z.enum(STATUS).parse(req.body.status);
      z.preprocess((input) => new Date(input), z.date()).parse(req.body.dueAt);
      if (req.body.completedAt) z.preprocess((input) => new Date(input), z.date()).parse(req.body.completedAt);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
      z.array(z.string().regex(looseUuidRegex)).parse(req.body.onlyVisibleBy);
    } catch (e) {
      const error = new Error(`Invalid request in consultation put: ${e}`);
      error.status = 400;
      return next(error);
    }

    const consultation = await Consultation.findOne({
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    });
    if (!consultation) return res.status(404).send({ ok: false, error: "Not Found" });

    const { status, dueAt, completedAt, encrypted, encryptedEntityKey, onlyVisibleBy } = req.body;
    consultation.set({
      status,
      dueAt,
      onlyVisibleBy,
      completedAt: completedAt || null,
      encrypted,
      encryptedEntityKey,
    });
    await consultation.save();

    return res.status(200).send({
      ok: true,
      data: {
        _id: consultation._id,
        encrypted: consultation.encrypted,
        encryptedEntityKey: consultation.encryptedEntityKey,
        organisation: consultation.organisation,
        createdAt: consultation.createdAt,
        updatedAt: consultation.updatedAt,
        deletedAt: consultation.deletedAt,
        status: consultation.status,
        dueAt: consultation.dueAt,
        completedAt: consultation.completedAt,
        onlyVisibleBy: consultation.onlyVisibleBy,
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
      const error = new Error(`Invalid request in consultation delete: ${e}`);
      error.status = 400;
      return next(error);
    }

    const consultation = await Consultation.findOne({
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    });
    if (!consultation) return res.status(200).send({ ok: true });

    consultation.set({ encrypted: null, encryptedEntityKey: null });
    await consultation.save();

    await consultation.destroy();

    res.status(200).send({ ok: true });
  })
);

module.exports = router;

module.exports = router;
