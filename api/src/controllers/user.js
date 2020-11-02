const express = require("express");
const router = express.Router();
const passport = require("passport");
const { catchErrors } = require("../errors");
const { capture } = require("../sentry");

const AuthObject = require("../auth");
const { pg, prepareUpdateQuery } = require("../pg");

const UserAuth = new AuthObject("user");
router.post("/signin", (req, res) => UserAuth.signin(req, res, false));

router.get(
  "/list",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const sql = `
         SELECT
            "user"."id" AS id,
            "user"."name" AS "name",
            "user".email AS email,
            "user".created_at AS "createdAt",
            team."name" AS "teamName",
            organisation."name" AS "organisationName"
         FROM "user"
         LEFT JOIN organisation ON "user".organisation_id = organisation."id"
         LEFT JOIN team ON "user".team_id = team."id"
      `;

    const users = (await pg.query(sql)).rows;
    res.status(200).send({ ok: true, users });
  })
);

router.get(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const userId = req.params.id;
    const sql = `
         SELECT
            "user"."id" AS id,
            "user"."name" AS "name",
            "user".email AS email,
            "user".created_at AS "createdAt",
            team."name" AS "teamName",
            team."id" AS "teamId",
            organisation."id" AS "organisationId",
            organisation."name" AS "organisationName"
         FROM "user"
         LEFT JOIN organisation ON "user".organisation_id = organisation."id"
         LEFT JOIN team ON "user".team_id = team."id"
         WHERE "user"."id" = $1
      `;
    const params = [userId];
    const result = (await pg.query(sql, params)).rows;
    if (!result.length) return res.status(404).send({ ok: false, user: null });
    res.status(200).send({ ok: true, user: result[0] });
  })
);

router.put(
  "/:id",
  // passport.authenticate("superadmin", { session: false }),
  catchErrors(async (req, res) => {
    const update = {};

    if (req.body.hasOwnProperty("name")) update.name = req.body.name;
    if (req.body.hasOwnProperty("email")) update.email = req.body.email;
    if (req.body.hasOwnProperty("organisation")) update.organisation_id = req.body.organisation._id;
    if (req.body.hasOwnProperty("team")) update.team_id = req.body.team._id;
    if (req.body.hasOwnProperty("role")) update.role = req.body.role;

    const fieldCount = Object.keys(update).length;
    if (!fieldCount) return res.status(200).send({ ok: true });

    const sql = prepareUpdateQuery(
      '"user"',
      update,
      `WHERE id = $${fieldCount + 1} RETURNING id AS _id, name, email, organisation_id AS organisation, team_id AS team, created_at AS "createdAt"`
    );
    const params = [...Object.values(update), req.params.id];
    const user = (await pg.query(sql, params)).rows[0];

    return res.status(200).send({ ok: true, user });
  })
);

router.put(
  "/",
  passport.authenticate("admin", { session: false }),
  catchErrors(async ({ body, user: { _id } }, res) => {
    const update = {};
    if (body.hasOwnProperty("name")) update.name = body.name;
    if (body.hasOwnProperty("email")) update.email = body.email;
    if (body.hasOwnProperty("organisation")) update.organisation_id = body.organisation._id;
    if (body.hasOwnProperty("team")) update.team_id = body.team._id;

    const fieldCount = Object.keys(update).length;
    if (!fieldCount) return res.status(200).send({ ok: true });

    const sql = prepareUpdateQuery(
      '"user"',
      update,
      `WHERE id = $${fieldCount + 1} RETURNING id AS _id, name, email, organisation_id AS organisation, team_id AS team, created_at AS "createdAt"`
    );
    const params = [...Object.values(update), _id];
    const user = (await pg.query(sql, params)).rows[0];

    return res.status(200).send({ ok: true, user });
  })
);

router.delete(
  "/:id",
  passport.authenticate("admin", { session: false }),
  catchErrors(async (req, res) => {
    await pg.query(`DELETE FROM "user" WHERE id = $1`, [req.user._id]);
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
