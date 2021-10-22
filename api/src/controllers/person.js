const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");

const { catchErrors } = require("../errors");

const Person = require("../models/person");
const Team = require("../models/team");
const RelPersonTeam = require("../models/relPersonTeam");
const encryptedTransaction = require("../utils/encryptedTransaction");
const { ENCRYPTED_FIELDS_ONLY } = require("../config");

//@checked
router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const newPerson = {};

    newPerson.organisation = req.user.organisation;
    newPerson.user = req.user._id;

    if (req.body.hasOwnProperty("name")) newPerson.name = req.body.name;

    if (req.body.hasOwnProperty("encrypted")) newPerson.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newPerson.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      const data = await Person.create(newPerson, { returning: true, transaction: tx });

      if (ENCRYPTED_FIELDS_ONLY) return data;

      if (req.body.hasOwnProperty("assignedTeams")) {
        await RelPersonTeam.bulkCreate(
          req.body.assignedTeams.map((teamId) => ({ person: data._id, team: teamId })),
          { transaction: tx }
        );
      }

      const relTeamPerson = await RelPersonTeam.findAll({
        where: {
          person: data._id,
        },
      });

      return {
        ...data.toJSON(),
        assignedTeams: relTeamPerson.map((rel) => rel.team),
      };
    });
    return res.status(status).send({ ok, data, error });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        organisation: req.user.organisation,
      },
    };

    if (req.query.lastRefresh) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(req.query.lastRefresh)) };
      // const data = await Person.findAll(query);
      // return res.status(200).send({ ok: true, data });
    }

    const total = await Person.count(query);

    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await Person.findAll(query);

    if (ENCRYPTED_FIELDS_ONLY) return res.status(200).send({ ok: true, hasMore: data.length === limit, data, total });

    const teams = await Team.findAll(query);
    const relTeamPersons = await RelPersonTeam.findAll({
      where: {
        team: { [Op.in]: teams.map((t) => t._id) },
      },
    });

    return res.status(200).send({
      ok: true,
      hasMore: data.length === limit,
      data: data.map((person) => ({
        ...person.toJSON(),
        assignedTeams: relTeamPersons.filter((rel) => rel.person === person._id).map((rel) => rel.team),
      })),
      total,
    });
  })
);

//@checked
router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };

    const person = await Person.findOne(query);
    if (!person) return res.status(404).send({ ok: false, error: "Not Found" });

    if (["Non", ""].includes(req.body.address)) {
      req.body.addressDetail = "";
    }

    if (req.body.createdAt) {
      person.changed("createdAt", true);
      req.body.createdAt = new Date(req.body.createdAt);
    } else {
      req.body.createdAt = person.createdAt;
    }

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      await Person.update(req.body, query, { silent: false, transaction: tx });
      const newPerson = await Person.findOne(query);

      if (ENCRYPTED_FIELDS_ONLY) return person;

      if (req.body.hasOwnProperty("assignedTeams")) {
        await RelPersonTeam.destroy({ where: { person: req.params._id }, transaction: tx });
        await RelPersonTeam.bulkCreate(
          req.body.assignedTeams.map((teamId) => ({ person: req.params._id, team: teamId })),
          { transaction: tx }
        );
      }

      const relTeamPerson = await RelPersonTeam.findAll({
        where: {
          person: person._id,
        },
      });

      return {
        ...newPerson.toJSON(),
        assignedTeams: relTeamPerson.map((rel) => rel.team),
      };
    });

    res.status(status).send({ ok, data, error });
  })
);

//@checked
router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };

    let person = await Person.findOne(query);
    if (!person) return res.status(404).send({ ok: false, error: "Not Found" });

    await person.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
