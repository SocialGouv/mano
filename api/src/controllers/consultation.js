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
      z.object({
        status: z.enum(STATUS),
        dueAt: z.preprocess((input) => new Date(input), z.date()),
        ...([DONE, CANCEL].includes(req.body.status) ? { completedAt: z.preprocess((input) => new Date(input), z.date()) } : {}),
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
        onlyVisibleBy: z.array(z.string().regex(looseUuidRegex)),
      }).parse(req.body);
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
      z.object({
        limit: z.optional(z.string().regex(positiveIntegerRegex)),
        page: z.optional(z.string().regex(positiveIntegerRegex)),
        after: z.optional(z.string().regex(positiveIntegerRegex)),
        withDeleted: z.optional(z.enum(["true", "false"])),
      }).parse(req.query);
    } catch (e) {
      const error = new Error(`Invalid request in consultation get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, after, withDeleted } = req.query;

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
        "onlyVisibleBy",
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
      z.object({
        consultations: z.array(
          z.object({
            _id: z.string().regex(looseUuidRegex),
            encrypted: z.string(),
            encryptedEntityKey: z.string(),
          })
        ),
        organisationsConsultations: z.optional(
          z.array(
            z.object({
              name: z.string().min(1),
              fields: z.array(customFieldSchema),
            })
          )
        ),
      }).parse(req.body);
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

        // Note by Rap2h: I don't understand why `organisation.set({ consultations: organisationsConsultations })`
        // doesn't work here. Maybe JSONB is not handled correctly by Sequelize?
        organisation.consultations = organisationsConsultations;
        organisation.changed("consulations", true);
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
      z.object({
        params: z.object({
          _id: z.string().regex(looseUuidRegex),
        }),
        body: z.object({
          status: z.enum(STATUS),
          dueAt: z.preprocess((input) => new Date(input), z.date()),
          ...([DONE, CANCEL].includes(req.body.status) ? { completedAt: z.preprocess((input) => new Date(input), z.date()) } : {}),
          encrypted: z.string(),
          encryptedEntityKey: z.string(),
          onlyVisibleBy: z.array(z.string().regex(looseUuidRegex)),
        }),
      }).parse(req);
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
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
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

    await consultation.destroy();

    res.status(200).send({ ok: true });
  })
);

module.exports = router;
