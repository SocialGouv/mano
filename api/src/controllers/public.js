const express = require("express");
const router = express.Router();
const { catchErrors } = require("../errors");
const Action = require("../models/action");
const Comment = require("../models/comment");
const Person = require("../models/person");
const User = require("../models/user");
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
    return res.status(200).send({ ok: true, data: { totalUsers: Math.round(totalUsers / 3), count: feedbacks + 40 } });
  })
);

module.exports = router;
