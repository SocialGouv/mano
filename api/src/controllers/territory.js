const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");
const { catchErrors } = require("../errors");
const { Territory, TerritoryObservation, Organisation, sequelize } = require("../db/sequelize");
const { Op } = require("sequelize");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");
const { serializeOrganisation } = require("../utils/data-serializer");

router.post(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in territory creation: ${e}`);
      error.status = 400;
      return next(error);
    }
    const data = await Territory.create(
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

router.post(
  "/import",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        territoriesToImport: z.array(
          z.object({
            _id: z.optional(z.string().regex(looseUuidRegex)),
            encrypted: z.string(),
            encryptedEntityKey: z.string(),
          })
        ),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in territories import: ${e}`);
      error.status = 400;
      return next(error);
    }

    const territories = req.body.territoriesToImport.map((t) => {
      const territory = {
        _id: t._id,
        encrypted: t.encrypted,
        encryptedEntityKey: t.encryptedEntityKey,
        organisation: req.user.organisation,
        user: req.user._id,
      };
      return territory;
    });
    await Territory.bulkCreate(territories);

    return res.status(200).send({
      ok: true,
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal", "restricted-access", "stats-only"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        limit: z.optional(z.string().regex(positiveIntegerRegex)),
        page: z.optional(z.string().regex(positiveIntegerRegex)),
        after: z.optional(z.string().regex(positiveIntegerRegex)),
        withDeleted: z.optional(z.enum(["true", "false"])),
      }).parse(req.query);
    } catch (e) {
      const error = new Error(`Invalid request in territory get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await Territory.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await Territory.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "createdAt", "updatedAt", "deletedAt"],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === Number(limit), total });
  })
);

router.put(
  "/types",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        territories: z.optional(
          z.array(
            z.object({
              _id: z.string().regex(looseUuidRegex),
              encrypted: z.string(),
              encryptedEntityKey: z.string(),
            })
          )
        ),
        territoriesGroupedTypes: z.array(
          z.object({
            groupTitle: z.string(),
            types: z.array(z.string()),
          })
        ),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in territories types update: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    const { territories = [], territoriesGroupedTypes = [] } = req.body;

    await sequelize.transaction(async (tx) => {
      for (let { encrypted, encryptedEntityKey, _id } of territories) {
        await Territory.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx });
      }

      organisation.set({ territoriesGroupedTypes });
      await organisation.save({ transaction: tx });
    });
    return res.status(200).send({ ok: true, data: serializeOrganisation(organisation) });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["admin", "normal"]),
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
      const error = new Error(`Invalid request in territory put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const territory = await Territory.findOne(query);
    if (!territory) return res.status(404).send({ ok: false, error: "Not found" });

    const { encrypted, encryptedEntityKey } = req.body;

    const updateTerritory = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
    };

    territory.set(updateTerritory);
    await territory.save();

    return res.status(200).send({ ok: true, data: territory });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in territory delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    // FIXME: not compatible with app versions below 3.5.4
    // try {
    //   z.array(z.string().regex(looseUuidRegex)).parse(req.body.observationIds);
    // } catch (e) {
    //   const error = new Error(`Invalid request in territory delete comments: ${e}`);
    //   error.status = 400;
    //   return next(error);
    // }

    await sequelize.transaction(async (tx) => {
      const territory = await Territory.findOne({
        where: {
          _id: req.params._id,
          organisation: req.user.organisation,
        },
      });
      if (territory) await territory.destroy({ transaction: tx });
      for (let _id of req.body.observationIds || []) {
        await TerritoryObservation.destroy({ where: { _id, organisation: req.user.organisation }, transaction: tx });
      }
    });

    res.status(200).send({ ok: true });
  })
);

module.exports = router;
