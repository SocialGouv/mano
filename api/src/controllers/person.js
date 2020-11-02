const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");

const { pg } = require("../pg");
const { prepareUpdateQuery } = require("../pg");

const getFromId = async ({ params: { id } }, res) => {
  const person = (
    await pg.query(
      `SELECT id AS _id, name, gender, birthdate, description, organisation_id AS organisation, user_id AS user, created_at AS "createdAt" FROM person WHERE "id" = $1`,
      [id]
    )
  ).rows[0];

  if (person) {
    person.actions = (
      await pg.query(
        `SELECT id AS _id, name AS name,
            status, due_at AS "dueAt", with_time AS "withTime",
            structure_id AS structure, organisation_id AS organisation, team_id AS team,
            user_id AS user, person_id, created_at AS "createdAt", person_id AS person
            FROM action
            WHERE person_id = $1`,
        [id]
      )
    ).rows;
  }
  return res.status(200).send({ ok: true, data: person });
};

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ body: { name }, user: { _id, organisation } }, res) => {
    const person = (
      await pg.query(
        `INSERT INTO person(name, user_id, organisation_id) VALUES ($1, $2, $3) RETURNING  id AS _id, name AS name,user_id AS user, organisation_id AS organisation`,
        [name, _id, organisation]
      )
    ).rows[0];

    return res.status(200).send({ ok: true, data: person });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ query: { search, place, limit = 30, page = 0 }, user }, res) => {
    let condition = "";
    if (search && search.length) {
      condition = search
        .split(" ")
        .map((k) => k.normalize("NFD").toLowerCase().trim())
        .filter((s) => !!s)
        .map((s) => s + ":*")
        .join(" | ");
    }
    const skip = page * limit;

    let paramCounter = 1;

    const data = (
      await pg.query(
        `SELECT "person".id AS _id, name, gender, birthdate,
        description, organisation_id AS organisation, user_id AS user,
        "person".created_at AS "createdAt"
      FROM person
      ${place ? ` LEFT JOIN "rel__person_place" ON "person".id = "rel__person_place"."person_id"` : ``}
      WHERE organisation_id = $${paramCounter++}
      ` +
          (condition ? `\nAND LOWER(name)::tsvector @@ $${paramCounter++}::tsquery` : "") +
          (place ? `\nAND rel__person_place.place_id = $${paramCounter++}` : ``) +
          "\nORDER BY name ASC" +
          (condition ? "" : `\nOFFSET ${skip} LIMIT ${limit}`),
        [user.organisation, ...(condition ? [condition] : []), ...(place ? [place] : [])]
      )
    ).rows;

    return res.status(200).send({ ok: true, data, hasMore: data.length === limit });
  })
);

router.get("/:id", passport.authenticate("user", { session: false }), catchErrors(getFromId));

router.put(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ params: { id }, body }, res, next) => {
    const update = {};

    if (body.hasOwnProperty("name")) update.name = body.name;
    if (body.hasOwnProperty("gender")) update.gender = body.gender;
    if (body.hasOwnProperty("birthdate")) update.birthdate = body.birthdate || null;
    if (body.hasOwnProperty("description")) update.description = body.description;

    const fieldCount = Object.keys(update).length;
    if (!fieldCount) return res.status(200).send({ ok: true });

    pg.query(prepareUpdateQuery("person", update, `WHERE id = $${fieldCount + 1}`), [...Object.values(update), id]);

    next();
  }),
  catchErrors(getFromId)
);

router.delete(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ params: { id } }, res) => {
    await Promise.all([
      pg.query(`DELETE FROM person WHERE id = $1`, [id]),
      pg.query(`DELETE FROM action WHERE person_id = $1`, [id]),
      pg.query(`DELETE FROM comment WHERE item_id = $1`, [id]),
      pg.query(`DELETE FROM rel__person_place WHERE person_id = $1`, [id]),
    ]);
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
