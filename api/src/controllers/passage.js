const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const Passage = require("../models/passage");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "restricted-access"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
        person: z.string().regex(looseUuidRegex).optional(),
        team: z.string().regex(looseUuidRegex),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in passage creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const data = await Passage.create(
      {
        organisation: req.user.organisation,
        encrypted: req.body.encrypted,
        encryptedEntityKey: req.body.encryptedEntityKey,
        person: req.body.person,
        team: req.body.team,
        user: req.user._id,
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
        team: data.team,
        user: data.user,
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
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.limit);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.page);
      z.optional(z.enum(["true", "false"])).parse(req.query.withDeleted);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.after);
    } catch (e) {
      const error = new Error(`Invalid request in passage get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await Passage.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await Passage.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "person", "team", "user", "createdAt", "updatedAt", "deletedAt"],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === Number(limit), total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "restricted-access"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
      if (req.body.createdAt) z.preprocess((input) => new Date(input), z.date()).parse(req.body.createdAt);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
      z.string().regex(looseUuidRegex).parse(req.body.person);
      z.string().regex(looseUuidRegex).parse(req.body.team);
      z.string().regex(looseUuidRegex).parse(req.body.user);
    } catch (e) {
      const error = new Error(`Invalid request in passage put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const passage = await Passage.findOne(query);
    if (!passage) return res.status(404).send({ ok: false, error: "Not Found" });

    const { encrypted, encryptedEntityKey, person, team, user } = req.body;

    const updatePassage = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
      person: person,
      team: team,
      user: user,
    };

    await Passage.update(updatePassage, query, { silent: false });
    const newPassage = await Passage.findOne(query);

    return res.status(200).send({
      ok: true,
      data: {
        _id: newPassage._id,
        encrypted: newPassage.encrypted,
        encryptedEntityKey: newPassage.encryptedEntityKey,
        organisation: newPassage.organisation,
        person: newPassage.person,
        team: newPassage.team,
        user: newPassage.user,
        createdAt: newPassage.createdAt,
        updatedAt: newPassage.updatedAt,
        deletedAt: newPassage.deletedAt,
      },
    });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      const error = new Error(`Invalid request in passage delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    const passage = await Passage.findOne(query);
    if (!passage) return res.status(200).send({ ok: true });

    await passage.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
