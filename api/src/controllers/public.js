const express = require("express");
const router = express.Router();

const { catchErrors } = require("../errors");

const Action = require("../models/action");
const Comment = require("../models/comment");
const Person = require("../models/person");
const Place = require("../models/place");
const Territory = require("../models/territory");
const TerritoryObservation = require("../models/territoryObservation");
const Report = require("../models/report");
const RelPersonPlace = require("../models/relPersonPlace");

router.get(
  "/stats",
  catchErrors(async (req, res) => {
    const query = {};
    if (req.query.organisation) query.where = { organisation: req.query.organisation };
    if (Number(req.query.lastRefresh)) {
      if (!query.where) query.where = {};
      query.where.updatedAt = { $gte: req.query.lastRefresh };
    }
    const places = await Place.count(query);
    const relsPersonPlace = await RelPersonPlace.count(query);
    const actions = await Action.count(query);
    const persons = await Person.count(query);
    const comments = await Comment.count(query);
    const reports = await Report.count(query);
    const territoryObservations = await TerritoryObservation.count(query);
    const territories = await Territory.count(query);
    return res
      .status(200)
      .send({ ok: true, data: { actions, comments, persons, places, relsPersonPlace, territories, territoryObservations, reports } });
  })
);

module.exports = router;
