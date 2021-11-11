const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { catchErrors } = require("../errors");

const RelPersonPlace = require("../models/relPersonPlace");
const encryptedTransaction = require("../utils/encryptedTransaction");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const { person, place } = req.body;
    if (!person || !place) return res.status(400).send({ ok: false, error: "Missing place or person" });

    const newRelPersonPlace = {};

    newRelPersonPlace.organisation = req.user.organisation;
    newRelPersonPlace.user = req.user._id;

    newRelPersonPlace.person = req.body.person || null;
    newRelPersonPlace.place = req.body.place || null;

    if (req.body.hasOwnProperty("encrypted")) newRelPersonPlace.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newRelPersonPlace.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      const data = await RelPersonPlace.create(newRelPersonPlace, { returning: true, transaction: tx });
      return data;
    });

    return res.status(status).send({ ok, data, error });
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

    const total = await RelPersonPlace.count(query);
    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await RelPersonPlace.findAll(query);
    return res.status(200).send({ ok: true, data, hasMore: data.length === limit, total });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const { _id } = req.params;
    try {
      await RelPersonPlace.destroy({ where: { _id } });
    } catch (e) {
      const query = {
        where: {
          _id: req.params._id,
          organisation: req.user.organisation,
        },
      };

      const relPersonPlace = await RelPersonPlace.findOne(query);
      relPersonPlace.set({ user: req.user._id });
      await relPersonPlace.save();
      await RelPersonPlace.destroy({ where: { _id } });
    }
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
