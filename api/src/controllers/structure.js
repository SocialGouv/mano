const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { z } = require("zod");
const { looseUuidRegex } = require("../utils");
const { catchErrors } = require("../errors");
const validateUser = require("../middleware/validateUser");
const Structure = require("../models/structure");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
    try {
      z.string().min(1).parse(req.body.name);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const name = req.body.name;
    const organisation = req.user.organisation;

    const data = await Structure.create({ name, organisation }, { returning: true });
    return res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
    try {
      z.optional(z.string()).parse(req.body.search);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const search = req.query.search;
    let query = { order: [["createdAt", "ASC"]] };
    if (search && search.length) {
      const terms = search
        .split(" ")
        .map((e) => e.trim())
        .filter((e) => e)
        .map((e) => `%${e}%`);
      query.where = {
        name: {
          [Op.iLike]: {
            [Op.any]: terms,
          },
        },
      };
    }
    const data = await Structure.findAll(query);
    return res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const _id = req.params._id;
    const data = await Structure.findOne({ where: { _id } });
    if (!data) return res.status(404).send({ ok: false, error: "Not Found" });
    return res.status(200).send({ ok: true, data });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
      z.string().min(1).parse(req.body.name);
      z.optional(z.string()).parse(req.body.description);
      z.optional(z.string()).parse(req.body.city);
      z.optional(z.string()).parse(req.body.postcode);
      z.optional(z.string()).parse(req.body.adresse);
      z.optional(z.string()).parse(req.body.phone);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const _id = req.params._id;
    const updatedStructure = {
      name: req.body.name,
    };
    if (req.body.hasOwnProperty("description")) updatedStructure.description = req.body.description;
    if (req.body.hasOwnProperty("city")) updatedStructure.city = req.body.city;
    if (req.body.hasOwnProperty("postcode")) updatedStructure.postcode = req.body.postcode;
    if (req.body.hasOwnProperty("adresse")) updatedStructure.adresse = req.body.adresse;
    if (req.body.hasOwnProperty("phone")) updatedStructure.phone = req.body.phone;
    const [count, array] = await Structure.update(updatedStructure, { where: { _id }, returning: true });
    if (!count) return res.status(404).send({ ok: false, error: "Not Found" });
    const data = array[0];
    return res.status(200).send({ ok: true, data });
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
    const _id = req.params._id;
    await Structure.destroy({ where: { _id } });
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
