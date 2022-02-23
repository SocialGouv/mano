const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");
const Territory = require("../models/territory");
const { Op } = require("sequelize");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const newTerritory = {};

    newTerritory.organisation = req.user.organisation;
    newTerritory.user = req.user._id;
    newTerritory.name = req.body.name;

    // Todo: ignore fields that are encrypted.
    if (req.body.hasOwnProperty("types")) newTerritory.types = req.body.types;
    if (req.body.hasOwnProperty("perimeter")) newTerritory.perimeter = req.body.perimeter;
    if (req.body.hasOwnProperty("encrypted")) newTerritory.encrypted = req.body.encrypted;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newTerritory.encryptedEntityKey = req.body.encryptedEntityKey;

    const data = await Territory.create(newTerritory, { returning: true });
    return res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        organisation: req.user.organisation,
      },
      order: [["createdAt", "DESC"]],
    };
    const attributes = [
      // Generic fields
      "_id",
      "encrypted",
      "encryptedEntityKey",
      "organisation",
      "createdAt",
      "updatedAt",
    ];

    if (req.query.lastRefresh) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(req.query.lastRefresh)) };
      const data = await Territory.findAll({ ...query, attributes });
      return res.status(200).send({ ok: true, data });
    }

    const total = await Territory.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await Territory.findAll({ ...query, attributes });
    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateOrganisationEncryption,
  catchErrors(async (req, res) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };
    const updateTerritory = {};
    // Todo: ignore fields that are encrypted.
    if (req.body.hasOwnProperty("name")) updateTerritory.name = req.body.name;
    if (req.body.hasOwnProperty("types")) updateTerritory.types = req.body.types;
    if (req.body.hasOwnProperty("perimeter")) updateTerritory.perimeter = req.body.perimeter;
    if (req.body.hasOwnProperty("encrypted")) updateTerritory.encrypted = req.body.encrypted;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updateTerritory.encryptedEntityKey = req.body.encryptedEntityKey;

    const territory = await Territory.findOne(query);
    if (!territory) return res.status(404).send({ ok: false, error: "Not found" });
    territory.set(updateTerritory);
    await territory.save();

    return res.status(200).send({ ok: true, data: territory });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };

    let territory = await Territory.findOne(query);
    if (!territory) return res.status(404).send({ ok: false, error: "Not Found" });

    await territory.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
