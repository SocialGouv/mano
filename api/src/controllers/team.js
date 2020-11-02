const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");

const { pg, prepareUpdateQuery, prepareConditionQuery } = require("../pg");

const getFromId = async ({ params: { id } }, res) => {
  const sql = `SELECT id AS _id, name, organisation_id AS organisation, created_at AS "createdAt"  FROM team WHERE id = $1`;
  const params = [id];
  const result = (await pg.query(sql, params)).rows;
  const data = result.length ? result[0] : null;
  return res.status(200).send({ ok: true, data });
};

router.post(
  "/",
  passport.authenticate("admin", { session: false }),
  catchErrors(async ({ body: { organisation, name } }, res) => {
    await pg.query(`INSERT INTO team(name, organisation_id) VALUES ($1, $2)`, [name, organisation]);
    res.status(200).send({ ok: true });
  })
);

router.get(
  "/",
  passport.authenticate("admin", { session: false }),
  catchErrors(async ({ query }, res) => {
    let condition = [],
      params = [];

    if (query.hasOwnProperty("organisation")) {
      condition.push("organisation_id = ?");
      params.push(query.organisation);
    }

    let sql = `
      SELECT
        team.id AS id,
        team.name AS name,
        team.created_at AS "createdAt",
        organisation_id AS "organisationId",
        organisation."name" AS "organisationName",
        organisation.created_at AS "organisationCreatedAt"
      FROM 
        team
        LEFT JOIN organisation ON team.organisation_id = organisation.ID
    `;

    if (condition.length) {
      sql += "\nWHERE\n";
      sql += prepareConditionQuery(condition);
    }

    sql += "\n ORDER BY team.created_at ASC";

    const result = (await pg.query(sql, params)).rows;
    let data = [];

    result.forEach((team) => {
      data.push({
        _id: team.id,
        name: team.name,
        createdAt: team.created_at,
        organisation: { _id: team.organisationId, name: team.organisationName, createdAt: team.organisationCreatedAt },
      });
    });

    res.status(200).send({ ok: true, data });
  })
);

router.get("/:id", passport.authenticate("admin", { session: false }), catchErrors(getFromId));

router.put(
  "/:id",
  passport.authenticate("admin", { session: false }),
  catchErrors(async ({ params: { id }, body }, res, next) => {
    const update = {};

    if (body.hasOwnProperty("name")) update.name = body.name;
    if (body.hasOwnProperty("organisation")) update.organisation_id = body.organisation;
    const fieldCount = Object.keys(update).length;
    if (!fieldCount) next();
    const query = prepareUpdateQuery("team", update, `WHERE id = $${fieldCount + 1}`);
    const params = [...Object.values(update), id];

    await pg.query(query, params);

    next();
  }),
  catchErrors(getFromId)
);

router.delete(
  "/:id",
  passport.authenticate("admin", { session: false }),
  catchErrors(async (req, res) => {
    await pg.query(`DELETE FROM team WHERE id = ?`, [req.params.id]);
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
