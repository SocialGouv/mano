const express = require("express");
const router = express.Router();
const { catchErrors } = require("../errors");
const { Action, Comment, Person, User, Organisation } = require("../db/sequelize");
const { Op } = require("sequelize");
const { getUmapGeoJSONFromOrgs } = require("../utils/getUmapGeoJSONFromOrgs");

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

// https://discover.umap-project.org/fr/tutorials/10-embed-remote-data/#1-jutilise-des-donnees-distantes
router.get(
  "/umap-geojson",
  catchErrors(async (_req, res) => {
    const organisations = await Organisation.findAll({ where: { _id: { [Op.ne]: "00000000-5f5a-89e2-2e60-88fa20cc50be" } } });
    const geoJSON = getUmapGeoJSONFromOrgs(organisations);
    return res.status(200).send(geoJSON);
  })
);

module.exports = router;
