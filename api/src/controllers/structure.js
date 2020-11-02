const express = require("express");
const router = express.Router();
const passport = require("passport");
const { prepareUpdateQuery } = require("../pg");
const { pg } = require("../pg");

const { catchErrors } = require("../errors");

const getFromId = async ({ params: { id } }, res) => {
  const data = (
    await pg.query(
      `SELECT id AS _id, name, description, city, postcode, phone, organisation_id AS organisation, created_at AS "createdAt", categories, adresse FROM structure WHERE id = $1`,
      [id]
    )
  ).rows[0];
  return res.status(200).send({ ok: true, data });
};

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ body, user: { organisation } }, res) => {
    const data = (
      await pg.query(
        `INSERT INTO structure (name, organisation_id) VALUES ($1, $2) RETURNING id AS _id, name, organisation_id AS organisation, created_at AS createdAt`,
        [body.name, organisation]
      )
    ).rows[0];
    res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ query: { search } }, res) => {
    let condition = "";
    if (search && search.length) {
      condition = search
        .trim()
        .split(" ")
        .map((k) => k.normalize("NFD").toLowerCase().trim() + ":*")
        .join(" | ");
    }

    const structures = (
      await pg.query(
        `SELECT id AS _id, name, description, city, postcode, phone, organisation_id AS organisation,
    created_at AS "createdAt", categories, adresse FROM structure` +
          (condition
            ? ` WHERE text_array_to_tsvector(categories) @@ $1::tsquery
        OR LOWER(name)::tsvector @@ $2::tsquery`
            : "") +
          "\nORDER BY created_at ASC",
        condition ? [condition, condition] : []
      )
    ).rows;

    res.status(200).send({ ok: true, data: structures || [] });
  })
);

router.get(
  "/autoComplete",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ user, query: { query } }, res) => {
    const organisationId = user.organisation;
    if (!query) {
      const structures = (
        await pg.query(
          `SELECT structure.id, structure.name FROM structure WHERE ("structure"."organisation_id" = $1 OR "structure"."organisation_id" IS NULL)`,
          [organisationId]
        )
      ).rows;

      return res.status(200).send({ ok: true, data: structures });
    }

    let condition = query
      .split(" ")
      .map((k) => k.normalize("NFD").toLowerCase().trim())
      .filter((s) => !!s)
      .map((s) => s + ":*")
      .join(" | ");

    const structures = (
      await pg.query(
        `SELECT structure.id, structure.name
      FROM structure
       WHERE ("structure"."organisation_id" = $1 OR "structure"."organisation_id" IS NULL)
       AND LOWER(structure.name)::tsvector @@ $2::tsquery`,
        [organisationId, condition]
      )
    ).rows;

    res.status(200).send({ ok: true, data: structures });
  })
);

router.get("/:id", passport.authenticate("user", { session: false }), catchErrors(getFromId));

router.put(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ params: { id }, body }, res, next) => {
    const update = {};

    if (body.hasOwnProperty("name")) update.name = body.name;
    if (body.hasOwnProperty("description")) update.description = body.description;
    if (body.hasOwnProperty("organisation")) update.organisation_id = body.organisation;
    if (body.hasOwnProperty("city")) update.city = body.city;
    if (body.hasOwnProperty("postcode")) update.postcode = body.postcode;
    if (body.hasOwnProperty("phone")) update.phone = body.phone;
    if (body.hasOwnProperty("adresse")) update.adresse = body.adresse;
    if (body.hasOwnProperty("phone")) update.phone = body.phone;
    if (body.hasOwnProperty("categories")) update.categories = body.categories;

    const fieldCount = Object.keys(update).length;
    if (!fieldCount) next();

    const query = prepareUpdateQuery("structure", update, `WHERE id = $${fieldCount + 1}`);
    const params = [...Object.values(update), id];

    await pg.query(query, params);

    next();
  }),
  catchErrors(getFromId)
);

router.delete(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ params: { id } }, res) => {
    await pg.query(`DELETE FROM structure WHERE id = $1`, [id]);
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
