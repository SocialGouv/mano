const { pg } = require("../pg");

const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");

const getFromId = async ({ params: { id } }, res) => {
  const data = (
    await pg.query(
      `SELECT place.id AS _id, place.name, person_id AS person,"user"."id" AS "userId", "user"."name" AS "userName", place.created_at AS "createdAt"
      FROM place
      LEFT JOIN "user" ON "place".user_id = "user".id
      WHERE place."id" = $1
      `,
      [id]
    )
  ).rows[0];
  return res.status(200).send({ ok: true, data });
};

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ body: { name, person }, user }, res) => {
    const tx = await pg.connect();

    try {
      await tx.query("BEGIN");

      const place = (
        await tx.query(`INSERT INTO place(name, user_id) VALUES ($1, $2) RETURNING id AS _id, name, user_id AS user, created_at AS "createdAt"`, [
          name,
          user._id,
        ])
      ).rows[0];

      await tx.query(`INSERT INTO rel__person_place(person_id, place_id) VALUES ($1, $2)`, [person, place._id]);

      await tx.query("COMMIT");

      return res.status(200).send({ ok: true, data: place });
    } catch (e) {
      await tx.query("ROLLBACK");
      throw e;
    } finally {
      tx.release();
    }
  })
);

router.post(
  "/addUser",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ body: { person, place }, user }, res) => {
    await pg.query(`INSERT INTO rel__person_place(person_id, place_id) VALUES ($1, $2)`, [person, place]);
    return res.status(200).send({ ok: true, data: place });
  })
);

router.get(
  "/autoComplete",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ user, query: { query } }, res) => {
    const organisationId = user.organisation;
    if (!query) {
      const places = (
        await pg.query(
          `SELECT place.id, place.name FROM place LEFT JOIN "user" ON "user"."id" = "place"."user_id" WHERE "user"."organisation_id" = $1`,
          [organisationId]
        )
      ).rows;

      return res.status(200).send({ ok: true, data: places });
    }
    let condition = query
      .split(" ")
      .map((k) => k.normalize("NFD").toLowerCase().trim())
      .filter((s) => !!s)
      .map((s) => s + ":*")
      .join(" | ");

    const places = (
      await pg.query(
        `SELECT place.id, place.name FROM place LEFT JOIN "user" ON "user"."id" = "place"."user_id" WHERE "user"."organisation_id" = $1 AND LOWER(place.name)::tsvector @@ $2::tsquery`,
        [organisationId, condition]
      )
    ).rows;

    res.status(200).send({ ok: true, data: places });
  })
);

router.get("/:id", passport.authenticate("user", { session: false }), catchErrors(getFromId));

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    let { personId, limit } = req.query;

    const places = (
      await pg.query(
        `SELECT  "place".id AS _id, "place".name AS name, rel__person_place.person_id AS person,
        "place".created_at AS "createdAt",
        "user"."id" AS "userId", "user"."name" AS "userName"
        FROM "place"
        RIGHT JOIN "rel__person_place" ON "place".id = "rel__person_place"."place_id"
        LEFT JOIN "user" ON "place".user_id = "user".id
        ${personId ? "WHERE" : ""}
        ${personId ? ` rel__person_place."person_id" = $1 ` : ""}
        ORDER BY "place".created_at ASC
        LIMIT ${limit || 30}`,
        personId ? [personId] : []
      )
    ).rows.map(({ userId, userName, ...rest }) => ({
      ...rest,
      user: { _id: userId || "", name: userName || "" },
    }));

    res.status(200).send({ ok: true, data: places });
  })
);

router.put(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ params: { id }, body }, res, next) => {
    const { name } = body;
    if (!name) next();
    await pg.query(`UPDATE place SET name = $1 WHERE id = $2`, [name, id]);
    next();
  }),
  catchErrors(getFromId)
);

router.delete(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ params: { id } }, res) => {
    await pg.query(`DELETE FROM place WHERE id = $1`, [id]);
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
