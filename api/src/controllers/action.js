const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");

const { prepareUpdateQuery } = require("../pg");
const { pg } = require("../pg");

const getFromId = async ({ params: { id } }, res) => {
  const result = (
    await pg.query(
      `SELECT "action"."id" AS "_id", "action"."name" AS "name",
    status, due_at AS "dueAt", with_time AS "withTime",
    completed_at AS "completedAt", "action".created_at AS "createdAt",
    "person"."id" AS "personId", "person"."name" AS "personName",
    "structure"."id" AS "structureId", "structure"."name" AS "structureName",
    "user"."id" AS "userId", "user"."name" AS "userName"
    FROM action
    LEFT JOIN "person" ON "action".person_id = "person".id
    LEFT JOIN "structure" ON "action".structure_id = "structure".id
    LEFT JOIN "user" ON "action".user_id = "user".id
    WHERE "action".id = $1`,
      [id]
    )
  ).rows;

  const data = result.map(({ personId, personName, structureId, structureName, userId, userName, ...rest }) => ({
    ...rest,
    person: { _id: personId || "", name: personName || "" },
    structure: { _id: structureId || "", name: structureName || "" },
    user: { _id: userId || "", name: userName || "" },
  }))[0];

  return res.status(200).send({ ok: true, data });
};

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ body, user }, res) => {
    const data = (
      await pg.query(
        `INSERT INTO "action"(name, person_id, user_id, team_id) VALUES ($1, $2, $3, $4)
      RETURNING id AS _id, name, person_id AS person, user_id AS user, team_id AS team, created_at AS "createdAt"`,
        [body.name, body.person._id, user._id, user.team]
      )
    ).rows[0];

    res.status(200).send({ ok: true, data });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ query: { personId, structure, place, limit = 30, page = 0 }, user }, res) => {
    // two statuses of actions: FAIT (DONE) or A FAIRE (TO DO)
    // shown on the same list in the app : TO DO first, DONE after
    // on page 0: we load all the TO DO, and `limit`  DONE actions on top of it
    // on pages > 0: we only load remaing DONE actions\

    const skip = page * limit;
    let parameterCount = 1;

    const params = [user.team];
    if (personId) params.push(personId);
    if (structure) params.push(structure);
    if (place) params.push(place);

    const result = (
      await pg.query(
        `SELECT
        action.id AS _id,
        "action".name AS name,
        "action".status,
        "action".due_at AS "dueAt",
        "action".with_time AS "withTime",
        "action".structure_id AS structure,
        "action".organisation_id AS organisation,
        "action".team_id AS team,
        "action".user_id AS user,
        "action".completed_at AS "completedAt",
        "action".created_at AS "createdAt",
        "person"."id" AS "personId",
        "person"."name" AS "personName",
        "rel__person_place".place_id AS "placeId"
        FROM "action"
        LEFT JOIN "person" ON "action".person_id = "person".id
        LEFT JOIN "rel__person_place" ON "action".person_id = "rel__person_place".person_id

        WHERE "action".team_id = $${parameterCount++} ` +
          (personId ? ` AND "action".person_id = $${parameterCount++} ` : " ") +
          (structure ? ` AND "action".structure_id = $${parameterCount++} ` : " ") +
          (place ? ` AND rel__person_place.place_id = $${parameterCount++} ` : ``) +
          `ORDER BY
          ( CASE "action".status WHEN 'A FAIRE' THEN 1 WHEN 'FAIT' THEN 2 END ) ASC,
          due_at ASC, "action".created_at ASC
        OFFSET ${skip} LIMIT ${limit} `,
        params
      )
    ).rows;

    const actions = result
      .map(({ personId, personName, placeId, ...rest }) => ({
        ...rest,
        person: { _id: personId, name: personName },
        placeId,
      }))
      .reduce((actions, { placeId, ...action }) => {
        const existingAction = actions.find(({ _id }) => action._id === _id);
        if (!existingAction) {
          if (!placeId) return [...actions, { ...action, placeIds: [] }];
          return [...actions, { ...action, placeIds: [placeId] }];
        }
        return actions.map((action) => ({ ...action, placeIds: [...action.placeIds, placeId] }));
      }, []);
    console.log(actions);
    res.status(200).send({ ok: true, data: actions, hasMore: actions.length === limit });
  })
);

router.get(
  "/names",
  passport.authenticate("user", { session: false }),
  catchErrors(async (_, res) => {
    return res.status(200).send({
      ok: true,
      data: ["Docteur", "Prise de sang", "Examen", "RDV en salle de shoot"],
    });
  })
);

router.get("/:id", passport.authenticate("user", { session: false }), catchErrors(getFromId));

router.put(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ params: { id }, body, user }, res, next) => {
    const update = {};

    const initAction = (await pg.query(`SELECT id, status FROM action WHERE "action".id = $1`, [id])).rows[0];

    if (body.hasOwnProperty("name")) update.name = body.name;

    if (body.hasOwnProperty("person")) {
      update.person_id = body.person._id;
      update.organisation_id = user.organisation;
    }
    if (body.hasOwnProperty("structure")) update.structure_id = body.structure._id;
    if (body.hasOwnProperty("status")) {
      if (initAction.status !== body.status) {
        await pg.query(`INSERT INTO "comment"(comment, type, item_id, user_id) VALUES ($1,$2,$3,$4) RETURNING * `, [
          `${user.name} a changé le status de l'action: ${body.status === "FAIT" ? "FAIT" : "À FAIRE"}`,
          "action",
          initAction.id,
          user._id,
        ]);
      }
      update.status = body.status;
    }
    if (body.hasOwnProperty("description")) update.description = body.description;
    if (body.hasOwnProperty("dueAt")) update.due_at = body.dueAt;
    if (body.hasOwnProperty("withTime")) update.with_time = body.withTime;
    if (body.hasOwnProperty("completedAt")) update.completed_at = body.completedAt;

    const fieldCount = Object.keys(update).length;
    if (!fieldCount) return res.status(200).send({ ok: true });

    await pg.query(prepareUpdateQuery("action", update, ` WHERE id = $${fieldCount + 1}`, true), [...Object.values(update), id]);
    next();
  }),
  catchErrors(getFromId)
);

router.delete(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ params: { id } }, res) => {
    await Promise.all([pg.query(`DELETE FROM "action" WHERE id = $1`, [id]), pg.query(`DELETE FROM comment WHERE item_id = $1`, [id])]);
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
