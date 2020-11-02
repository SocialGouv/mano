const express = require("express");
const passport = require("passport");

const router = express.Router();

const { catchErrors } = require("../errors");
const { pg, prepareUpdateQuery } = require("../pg");

const getFromId = async ({ params: { id } }, res) => {
  const data = (await pg.query(`SELECT id AS _id, name, created_at AS "createdAt" FROM organisation WHERE id = $1`, [id])).rows[0];
  return res.status(200).send({ ok: true, data });
};

router.post(
  "/",
  passport.authenticate("superadmin", { session: false }),
  catchErrors(async (req, res) => {
    if (!req.body.name) return res.status(400).send({ ok: false });
    await pg.query(`INSERT INTO organisation(name) VALUES ($1)`, [req.body.name]);
    res.status(200).send({ ok: true });
  })
);

router.get(
  "/",
  passport.authenticate("superadmin", { session: false }),
  catchErrors(async (req, res) => {
    const data = (await pg.query(`SELECT id AS _id, name, created_at AS "createdAt" FROM organisation ORDER BY created_at ASC`)).rows;
    res.status(200).send({ ok: true, data: data || [] });
  })
);

router.get("/:id", passport.authenticate("admin", { session: false }), catchErrors(getFromId));

router.put(
  "/:id",
  passport.authenticate("superadmin", { session: false }),
  catchErrors(async ({ params: { id }, body }, res, next) => {
    const update = {};

    if (body.hasOwnProperty("name")) update.name = body.name;

    const fieldCount = Object.keys(update).length;
    if (!fieldCount) next();

    const query = prepareUpdateQuery("organisation", update, `WHERE id = $${fieldCount + 1}`);
    const params = [...Object.values(update), id];

    await pg.query(query, params);

    next();
  }),
  catchErrors(getFromId)
);

router.delete(
  "/:id",
  passport.authenticate("superadmin", { session: false }),
  catchErrors(async (req, res) => {
    await pg.query(`DELETE FROM organisation WHERE id = $1`, [req.params.id]);
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
