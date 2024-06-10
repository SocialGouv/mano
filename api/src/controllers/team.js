const express = require("express");
const router = express.Router();
const passport = require("passport");
const { z } = require("zod");
const { looseUuidRegex } = require("../utils");
const { catchErrors } = require("../errors");
const { Team, RelUserTeam, sequelize } = require("../db/sequelize");
const validateUser = require("../middleware/validateUser");

router.post(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        name: z.string(),
        nightSession: z.optional(z.boolean()),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in team creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    let organisation = req.user.organisation;
    const team = await Team.create({ organisation, name: req.body.name, nightSession: req.body.nightSession || false }, { returning: true });
    res.status(200).send({ ok: true, data: team });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser(["superadmin", "admin", "normal", "restricted-access", "stats-only"]),
  catchErrors(async (req, res) => {
    const data = await Team.findAll({ where: { organisation: req.user.organisation }, include: ["Organisation"] });
    return res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in team get by id: ${e}`);
      error.status = 400;
      return next(error);
    }
    const data = await Team.findOne({ where: { _id: req.params._id, organisation: req.user.organisation } });
    if (!data) return res.status(404).send({ ok: false, error: "Not Found" });

    return res.status(200).send({ ok: true, data });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        params: z.object({
          _id: z.string().regex(looseUuidRegex),
        }),
        body: z.object({
          name: z.string(),
          nightSession: z.optional(z.boolean()),
        }),
      }).parse(req);
    } catch (e) {
      const error = new Error(`Invalid request in team put: ${e}`);
      error.status = 400;
      return next(error);
    }
    const updateTeam = {};
    // eslint-disable-next-line no-prototype-builtins
    if (req.body.hasOwnProperty("name")) updateTeam.name = req.body.name;
    // eslint-disable-next-line no-prototype-builtins
    if (req.body.hasOwnProperty("nightSession")) updateTeam.nightSession = req.body.nightSession;

    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    await Team.update(updateTeam, query);
    const data = await Team.findOne(query);

    return res.status(200).send({ ok: true, data });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false, failWithError: true }),
  validateUser("admin"),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in team delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const usersWithOnlyThisTeam = await RelUserTeam.findAll({
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("team")), "teamCount"],
        ["user", "user"],
      ],
      group: ["user"],
      having: sequelize.literal("COUNT(team) = 1 AND bool_or(team = :teamId)"),
      replacements: { teamId: req.params._id },
    });
    if (usersWithOnlyThisTeam.length > 0) {
      return res.status(400).send({ ok: false, error: "Impossible de supprimer l'équipe car certains utilisateurs n'ont que cette équipe." });
    }
    await RelUserTeam.destroy({ where: { team: req.params._id } });
    await Team.destroy({ where: { _id: req.params._id, organisation: req.user.organisation } });
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
