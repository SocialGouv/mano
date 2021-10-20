const express = require("express");
const router = express.Router();
const passport = require("passport");

const { catchErrors } = require("../errors");
const Organisation = require("../models/organisation");
const User = require("../models/user");

//@checked
router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (req.user.role !== "superadmin") return res.status(403).send({ ok: false, error: "Forbidden" });
    if (!req.body.orgName) return res.status(400).send({ ok: false, error: "Missing organisation name" });
    const organisation = await Organisation.create({ name: req.body.orgName }, { returning: true });
    if (!req.body.name) return res.status(400).send({ ok: false, error: "Missing admin name" });
    if (!req.body.email) return res.status(400).send({ ok: false, error: "Missing admin email" });
    if (!req.body.password) return res.status(400).send({ ok: false, error: "Missing admin password" });

    await User.create(
      {
        name: req.body.name,
        email: req.body.email.trim().toLowerCase(),
        password: req.body.password,
        role: "admin",
        organisation: organisation._id,
      },
      { returning: true }
    );
    return res.status(200).send({ ok: true });
  })
);

//@checked
router.get(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const where = {};
    if (req.user.role !== "superadmin") where._id = req.user.organisation;
    const data = await Organisation.findAll({ where });
    return res.status(200).send({ ok: true, data });
  })
);

//@checked
router.get(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).send({ ok: false, error: "Forbidden" });
    const data = await Organisation.findOne({ where: { _id: req.params._id } });
    if (!data) return res.status(404).send({ ok: false, error: "Not Found" });
    return res.status(200).send({ ok: true, data });
  })
);

//@checked
router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (req.user.role !== "admin") return res.status(403).send({ ok: false, error: "Forbidden" });

    const query = { where: { _id: req.params._id } };
    const organisation = await Organisation.findOne(query);
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });

    const updateOrg = {};

    if (req.body.hasOwnProperty("name")) updateOrg.name = req.body.name;
    if (req.body.hasOwnProperty("categories")) updateOrg.categories = req.body.categories;
    if (req.body.hasOwnProperty("collaborations")) updateOrg.collaborations = req.body.collaborations;
    if (req.body.hasOwnProperty("customFieldsObs")) updateOrg.customFieldsObs = req.body.customFieldsObs;
    if (req.body.hasOwnProperty("encryptionEnabled")) updateOrg.encryptionEnabled = req.body.encryptionEnabled;
    if (req.body.hasOwnProperty("encryptionLastUpdateAt")) updateOrg.encryptionLastUpdateAt = req.body.encryptionLastUpdateAt;
    if (req.body.hasOwnProperty("receptionEnabled")) updateOrg.receptionEnabled = req.body.receptionEnabled;
    if (req.body.hasOwnProperty("services")) updateOrg.services = req.body.services;

    await organisation.update(updateOrg);

    return res.status(200).send({ ok: true, data: organisation });
  })
);

//@checked
router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    if (req.user.organisation !== req.params._id) return res.status(403).send({ ok: false, error: "Forbidden" });
    if (req.user.role !== "admin") return res.status(403).send({ ok: false, error: "Forbidden" });

    const result = await Organisation.destroy({ where: { _id: req.params._id } });
    if (result === 0) return res.status(404).send({ ok: false, error: "Not Found" });
    return res.status(200).send({ ok: true });
  })
);

module.exports = router;
