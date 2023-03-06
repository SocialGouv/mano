const express = require("express");
const router = express.Router();
const { catchErrors } = require("../errors");
const { Action, Comment, Person, User } = require("../db/sequelize");
const { Op } = require("sequelize");

router.get(
  "/stats",
  catchErrors(async (_req, res) => {
    const actions = await Action.count();
    const persons = await Person.count();
    const comments = await Comment.count();
    return res.status(200).send({ ok: true, data: { actions, comments, persons } });
  })
);

router.get(
  "/feedbacks",
  catchErrors(async (_req, res) => {
    const feedbacks = await User.count({ where: { gaveFeedbackEarly2023: true } });
    const totalUsers = await User.count({ where: { lastLoginAt: { [Op.gte]: "2022-11-01" } } });
    return res.status(200).send({ ok: true, data: { totalUsers: Math.round(totalUsers / 3), count: feedbacks + 57 } });
  })
);

module.exports = router;
