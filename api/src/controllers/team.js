const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");

const Team = require("../models/team");
const RelUserTeam = require("../models/relUserTeam");
const User = require("../models/user");

//@checked
router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (!req.body.name) return res.status(400).send({ ok: false, error: "Name is required" });
    if (req.user.role !== "admin") return res.status(400).send({ ok: false, error: "Admin role is required" });
    let organisation = req.user.organisation;
    await Team.create({ organisation, name: req.body.name });
    res.status(200).send({ ok: true });
  })
);

//@checked
router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    let query = { where: {}, include: ["Organisation"] };
    query.where.organisation = req.user.organisation;
    const data = await Team.findAll(query);
    return res.status(200).send({ ok: true, data });
  })
);

//@checked
router.get(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const where = { _id: req.params._id };
    where.organisation = req.user.organisation;
    const data = await Team.findOne({ where });
    if (!data) return res.status(404).send({ ok: false, error: "Not Found" });
    return res.status(200).send({ ok: true, data });
  })
);

//@checked
router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    const where = { _id: req.params._id };
    where.organisation = req.user.organisation;
    const updateTeam = {};
    if (req.body.hasOwnProperty("name")) updateTeam.name = req.body.name;
    if (req.body.hasOwnProperty("nightSession")) updateTeam.nightSession = req.body.nightSession;
    const data = await Team.update(updateTeam, { where, returning: true });
    return res.status(200).send({ ok: true, data });
  })
);

//@checked
router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const queryTeam = { where: { _id: req.params._id } };
    const queryRel = { where: { team: req.params._id } };
    queryTeam.where.organisation = req.user.organisation;
    await RelUserTeam.destroy(queryRel);
    await Team.destroy(queryTeam);
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
