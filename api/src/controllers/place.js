const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");

const Place = require("../models/place");
const encryptedTransaction = require("../utils/encryptedTransaction");

//@todo
router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (!req.body.name) return res.status(400).send({ ok: false, error: "Name is needed" });

    const newPlace = {};

    newPlace.organisation = req.user.organisation;
    newPlace.user = req.user._id;

    if (req.body.hasOwnProperty("name")) newPlace.name = req.body.name || null;

    if (req.body.hasOwnProperty("encrypted")) newPlace.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newPlace.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      const data = await Place.create(newPlace, { returning: true, transaction: tx });
      return data;
    });

    return res.status(status).send({ ok, data, error });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const data = await Place.findAll({
      where: {
        organisation: req.user.organisation,
      },
    });
    return res.status(200).send({ ok: true, data });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };

    const updatePlace = {};
    if (req.body.hasOwnProperty("name")) updatePlace.name = req.body.name || null;

    if (req.body.hasOwnProperty("encrypted")) updatePlace.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updatePlace.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const place = await Place.findOne(query);
    if (!place) return res.status(404).send({ ok: false, error: "Not found" });
    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      place.set(updatePlace);
      await place.save({ transaction: tx });
      return place;
    });

    return res.status(status).send({ ok, data, error });
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
