const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");

const Team = require("../models/team");
const RelUserTeam = require("../models/relUserTeam");
const validateUser = require("../middleware/validateUser");

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res) => {
    if (!req.body.name) return res.status(400).send({ ok: false, error: "Name is required" });
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
    let query = { where: {}, include: ["Organisation"] };
    query.where.organisation = req.user.organisation;
    const data = await Team.findAll(query);
    return res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res) => {
    const where = { _id: req.params._id };
    where.organisation = req.user.organisation;
    const data = await Team.findOne({ where });
    if (!data) return res.status(404).send({ ok: false, error: "Not Found" });
    return res.status(200).send({ ok: true, data });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    const where = { _id: req.params._id };
    where.organisation = req.user.organisation;
    const updateTeam = {};
    if (req.body.hasOwnProperty("name")) updateTeam.name = req.body.name;
    if (req.body.hasOwnProperty("nightSession")) updateTeam.nightSession = req.body.nightSession;
    await Team.update(updateTeam, { where });
    const data = await Team.findOne({ where });
    return res.status(200).send({ ok: true, data });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
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
