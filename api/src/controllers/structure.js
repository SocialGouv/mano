const express = require("express");
const router = express.Router();
const passport = require("passport");
const { where, fn, col } = require("sequelize");
const { catchErrors } = require("../errors");
const validateUser = require("../middleware/validateUser");
const Structure = require("../models/structure");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
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
    const search = req.query.search;
    let condition = "";
    if (search && search.length) {
      // Todo: fix or explain this.
      // Search should not be an SQL injection.
      condition = search
        .trim()
        .replace("/&/g", "")
        .split(" ")
        .map((k) => k.normalize("NFD").toLowerCase().trim())
        .filter((s) => !!s)
        .map((s) => s + ":*")
        .join(" | ");
    }

    let query = { order: [["createdAt", "ASC"]] };
    if (condition) query.where = { name: where(fn("to_tsvector", fn("LOWER", col("name"))), "@@", fn("to_tsquery", condition)) };

    const data = await Structure.findAll(query);
    return res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res) => {
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
    const _id = req.params._id;
    const body = req.body;
    const [count, array] = await Structure.update(body, { where: { _id }, returning: true });
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
    const _id = req.params._id;
    await Structure.destroy({ where: { _id } });
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
