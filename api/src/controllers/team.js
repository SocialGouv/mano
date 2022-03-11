const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { looseUuidRegex } = require("../utils");
const { catchErrors } = require("../errors");
const Team = require("../models/team");
const RelUserTeam = require("../models/relUserTeam");
const validateUser = require("../middleware/validateUser");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res) => {
    try {
      z.string().parse(req.body.name);
      z.optional(z.boolean()).parse(req.body.nightSession);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }

    let organisation = req.user.organisation;
    const team = await Team.create({ organisation, name: req.body.name, nightSession: req.body.nightSession || false }, { returning: true });
    res.status(200).send({ ok: true, data: team });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "superadmin"]),
  catchErrors(async (req, res) => {
    const data = await Team.findAll({ where: { organisation: req.user.organisation }, include: ["Organisation"] });
    return res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const data = await Team.findOne({ where: { _id: req.params._id, organisation: req.user.organisation } });
    if (!data) return res.status(404).send({ ok: false, error: "Not Found" });

    return res.status(200).send({ ok: true, data });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
      z.optional(z.string()).parse(req.body.name);
      z.optional(z.boolean()).parse(req.body.nightSession);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    const updateTeam = {};
    if (req.body.hasOwnProperty("name")) updateTeam.name = req.body.name;
    if (req.body.hasOwnProperty("nightSession")) updateTeam.nightSession = req.body.nightSession;
    const data = await Team.update(updateTeam, { where: { _id: req.params._id, organisation: req.user.organisation }, returning: true });
    return res.status(200).send({ ok: true, data });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res) => {
    try {
      z.string().regex(looseUuidRegex).parse(req.params._id);
    } catch (e) {
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    await RelUserTeam.destroy({ where: { team: req.params._id } });
    await Team.destroy({ where: { _id: req.params._id, organisation: req.user.organisation } });
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
