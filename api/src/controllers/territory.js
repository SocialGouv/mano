const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { looseUuidRegex, positiveIntegerRegex } = require("../utils");
const { catchErrors } = require("../errors");
const Territory = require("../models/territory");
const { Op } = require("sequelize");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");
const validateUser = require("../middleware/validateUser");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  validateOrganisationEncryption,
  catchErrors(async (req, res) => {
    try {
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
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
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
    try {
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.limit);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.page);
      z.optional(z.string().regex(positiveIntegerRegex)).parse(req.query.lastRefresh);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const { limit, page, lastRefresh } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["createdAt", "DESC"]],
    };

    const total = await Territory.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (lastRefresh) query.where.updatedAt = { [Op.gte]: new Date(Number(lastRefresh)) };

    const data = await Territory.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "createdAt", "updatedAt"],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === Number(limit), total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  validateOrganisationEncryption,
  catchErrors(async (req, res) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
      z.string().parse(req.body.encrypted);
      z.string().parse(req.body.encryptedEntityKey);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
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
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    const territory = await Territory.findOne(query);
    if (!territory) return res.status(404).send({ ok: false, error: "Not Found" });

    await territory.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
