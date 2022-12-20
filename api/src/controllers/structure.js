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
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        body: z.object({
          name: z.string().min(1),
          description: z.optional(z.string()),
          city: z.optional(z.string()),
          postcode: z.optional(z.string()),
          adresse: z.optional(z.string()),
          phone: z.optional(z.string()),
          categories: z.optional(z.array(z.string())),
        }),
      }).parse(req);
    } catch (e) {
      const error = new Error(`Invalid request in structure creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const existingStructure = await Structure.findOne({
      where: { name: req.body.name, organisation: req.user.organisation },
    });
    if (existingStructure) {
      return res.status(400).send({ ok: false, error: "Une structure avec le même nom existe déjà" });
    }

    const newStructure = {
      name: req.body.name,
      organisation: req.user.organisation,
    };
    if (req.body.hasOwnProperty("phone")) newStructure.phone = req.body.phone;
    if (req.body.hasOwnProperty("adresse")) newStructure.adresse = req.body.adresse;
    if (req.body.hasOwnProperty("city")) newStructure.city = req.body.city;
    if (req.body.hasOwnProperty("postcode")) newStructure.postcode = req.body.postcode;
    if (req.body.hasOwnProperty("description")) newStructure.description = req.body.description;
    if (req.body.hasOwnProperty("categories")) newStructure.categories = req.body.categories;

    const data = await Structure.create(newStructure, { returning: true });
    return res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.optional(z.string()).parse(req.query.search);
    } catch (e) {
      const error = new Error(`Invalid request in structure get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const search = req.query.search;
    const query = {
      where: { organisation: req.user.organisation },
      order: [["name", "ASC"]],
    };
    if (search && search.length) {
      const terms = search
        .split(" ")
        .map((e) => e.trim())
        .filter((e) => e)
        .map((e) => `%${e}%`);
      query.where.name = {
        [Op.iLike]: {
          [Op.any]: terms,
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
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in structure get by id: ${e}`);
      error.status = 400;
      return next(error);
    }
    const _id = req.params._id;
    const data = await Structure.findOne({ where: { _id, organisation: req.user.organisation } });
    if (!data) return res.status(404).send({ ok: false, error: "Not Found" });
    return res.status(200).send({ ok: true, data });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        params: z.object({
          _id: z.string().regex(looseUuidRegex),
        }),
        body: z.object({
          name: z.string().min(1),
          description: z.optional(z.string()),
          city: z.optional(z.string()),
          postcode: z.optional(z.string()),
          adresse: z.optional(z.string()),
          phone: z.optional(z.string()),
          categories: z.optional(z.array(z.string())),
        }),
      }).parse(req);
    } catch (e) {
      const error = new Error(`Invalid request in structure put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const _id = req.params._id;
    const updatedStructure = {};
    if (req.body.hasOwnProperty("name")) {
      const existingStructure = await Structure.findOne({
        where: { name: req.body.name, organisation: req.user.organisation, _id: { [Op.ne]: _id } },
      });
      if (existingStructure) {
        return res.status(400).send({ ok: false, error: "Une structure avec le même nom existe déjà" });
      }
      updatedStructure.name = req.body.name;
    }

    if (req.body.hasOwnProperty("phone")) updatedStructure.phone = req.body.phone;
    if (req.body.hasOwnProperty("adresse")) updatedStructure.adresse = req.body.adresse;
    if (req.body.hasOwnProperty("city")) updatedStructure.city = req.body.city;
    if (req.body.hasOwnProperty("postcode")) updatedStructure.postcode = req.body.postcode;
    if (req.body.hasOwnProperty("description")) updatedStructure.description = req.body.description;
    if (req.body.hasOwnProperty("categories")) updatedStructure.categories = req.body.categories;

    const [count, array] = await Structure.update(updatedStructure, { where: { _id, organisation: req.user.organisation }, returning: true });
    if (!count) return res.status(404).send({ ok: false, error: "Not Found" });
    const data = array[0];
    return res.status(200).send({ ok: true, data });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in structure delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const _id = req.params._id;
    await Structure.destroy({ where: { _id, organisation: req.user.organisation } });
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
