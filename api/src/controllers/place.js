const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { catchErrors } = require("../errors");
const validateOrganisationEncryption = require("../middleware/validateOrganisationEncryption");
const Place = require("../models/place");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateOrganisationEncryption,
  catchErrors(async (req, res, next) => {
    if (!req.body.name) return res.status(400).send({ ok: false, error: "Name is needed" });

    const newPlace = {};

    newPlace.organisation = req.user.organisation;

    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in place create");
    }
    if (req.body.hasOwnProperty("encrypted")) newPlace.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newPlace.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const data = await Place.create(newPlace, { returning: true });
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
    if (req.query.lastRefresh) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(req.query.lastRefresh)) };
    }

    const total = await Place.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await Place.findAll({
      ...query,
      attributes: [
        // Generic fields
        "_id",
        "encrypted",
        "encryptedEntityKey",
        "organisation",
        "createdAt",
        "updatedAt",
      ],
    });
    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateOrganisationEncryption,
  catchErrors(async (req, res, next) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };

    const place = await Place.findOne(query);
    if (!place) return res.status(404).send({ ok: false, error: "Not found" });

    const updatePlace = {};
    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      return next("No encrypted field in place update");
    }
    if (req.body.hasOwnProperty("encrypted")) updatePlace.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updatePlace.encryptedEntityKey = req.body.encryptedEntityKey || null;

    place.set(updatePlace);
    await place.save();

    return res.status(200).send({ ok: true, data: place });
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

    const place = await Place.findOne(query);
    if (!place) return res.status(404).send({ ok: false, error: "Not Found" });

    await place.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
