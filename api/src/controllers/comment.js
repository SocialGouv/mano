const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");

const { pg } = require("../pg");

const NO_COMMENT = "NO_COMMENT";

const getFromId = async ({ params: { id } }, res) => {
  let { id: _id, comment, item_id, type, created_at: createdAt } = (await pg.query(`SELECT * FROM "comment" WHERE id = $1`, [id])).rows[0];
  return res.status(200).send({ ok: true, data: { _id, comment, [type]: item_id, createdAt } });
};

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ user, body }, res) => {
    if (!body || !body.comment) return res.status(403).send({ ok: false, code: NO_COMMENT });
    let itemId, commentType;
    
    if (body.hasOwnProperty("person")) {
      itemId = body.person;
      commentType = "person";
    }

    if (body.hasOwnProperty("action")) {
      itemId = body.action;
      commentType = "action";
    }

    let { id: _id, comment, item_id, type, created_at: createdAt } = (
      await pg.query(`INSERT INTO "comment"(comment, type, item_id, user_id) VALUES ($1,$2,$3,$4) RETURNING * `, [
        body.comment,
        commentType,
        itemId,
        user._id,
      ])
    ).rows[0];

    return res.status(200).send({ ok: true, data: { _id, comment, [type]: item_id, createdAt } });
  })
);

router.get("/:id", passport.authenticate("user", { session: false }), catchErrors(getFromId));

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const { limit, personId, actionId } = req.query;
    let itemId;

    if (personId) itemId = personId;
    if (actionId) itemId = actionId;

    const comments = (
      await pg.query(
        `SELECT *,
        "user"."id" AS "userId", "user"."name" AS "userName", "comment".created_at AS "created_at"
        FROM "comment"
        LEFT JOIN "user" ON "comment".user_id = "user".id
        ${itemId ? ` WHERE item_id = $1 ` : ""}
        ORDER BY "comment".created_at DESC LIMIT ${limit || 30}`,
        [itemId]
      )
    ).rows.map((comment) => ({
      _id: comment.id,
      comment: comment.comment,
      [comment.type]: comment.item_id,
      createdAt: comment.created_at,
      user: { _id: comment.userId || "", name: comment.userName || "" },
    }));

    res.status(200).send({ ok: true, data: comments });
  })
);

router.put(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ params: { id }, body }, res, next) => {
    const { comment } = body;
    if (!comment) return res.status(403).send({ ok: false, code: NO_COMMENT });
    await pg.query(`UPDATE "comment" SET comment = $1 WHERE id = $2`, [comment, id]);
    next();
  }),
  catchErrors(getFromId)
);

router.delete(
  "/:id",
  passport.authenticate("user", { session: false }),
  catchErrors(async ({ params: { id } }, res) => {
    await pg.query(`DELETE FROM comment WHERE id = $1`, [id]);
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
