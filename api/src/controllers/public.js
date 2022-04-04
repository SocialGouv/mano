const express = require("express");
const router = express.Router();
const { catchErrors } = require("../errors");
const Action = require("../models/action");
const Comment = require("../models/comment");
const Person = require("../models/person");

router.get(
  "/stats",
  catchErrors(async (_req, res) => {
    const actions = await Action.count();
    const persons = await Person.count();
    const comments = await Comment.count();
    return res.status(200).send({ ok: true, data: { actions, comments, persons } });
  })
);

module.exports = router;
