const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");
const { catchErrors } = require("../errors");
const Person = require("../models/person");
const encryptedTransaction = require("../utils/encryptedTransaction");
const { STORAGE_DIRECTORY } = require("../config");

// Return the basedir to store persons' documents.
function personDocumentBasedir(userOrganisation, personId) {
  const basedir = STORAGE_DIRECTORY ? path.join(STORAGE_DIRECTORY, "uploads") : path.join(__dirname, "../../uploads");
  return path.join(basedir, `${userOrganisation}`, "persons", `${personId}`);
}

// Upload a document for a person.
router.post(
  "/:id/document",
  passport.authenticate("user", { session: false }),
  // Use multer to handle the file upload.
  multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        const dir = personDocumentBasedir(req.user.organisation, req.params.id);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (_req, _file, cb) => {
        return cb(null, crypto.randomBytes(30).toString("hex"));
      },
    }),
  }).single("file"),
  catchErrors(async (req, res) => {
    const { file } = req;
    // Send back file information.
    res.send({
      ok: true,
      data: {
        originalname: file.originalname,
        filename: file.filename,
        size: file.size,
        encoding: file.encoding,
        mimetype: file.mimetype,
      },
    });
  })
);

// Download a file for a person by its filename.
router.get(
  "/:id/document/:filename",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const dir = personDocumentBasedir(req.user.organisation, req.params.id);
    const file = path.join(dir, req.params.filename);
    if (!fs.existsSync(file)) {
      res.status(404).send({ ok: false, message: "File not found" });
    } else {
      res.sendFile(file);
    }
  })
);

// Delete a file for a person by its filename.
router.delete(
  "/:id/document/:filename",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const dir = personDocumentBasedir(req.user.organisation, req.params.id);
    const file = path.join(dir, req.params.filename);
    if (!fs.existsSync(file)) {
      res.status(404).send({ ok: false, message: "File not found" });
    } else {
      fs.unlinkSync(file);
      res.send({ ok: true });
    }
  })
);

router.post(
  "/import",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res) => {
    const persons = req.body.map((p) => ({
      ...p,
      organisation: req.user.organisation,
      user: req.user._id,
    }));

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      const data = await Person.bulkCreate(persons, { returning: true, transaction: tx });
      return data.map((p) => p.toJSON());
    });
    return res.status(status).send({ ok, data, error });
  })
);

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    const newPerson = {};

    newPerson.organisation = req.user.organisation;

    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      next("No encrypted field in person create");
      return res.send(403).send({ ok: false, error: "Une erreur de chiffrement est survenue. L'équipe technique a été prévenue" });
    }
    if (req.body.hasOwnProperty("encrypted")) newPerson.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) newPerson.encryptedEntityKey = req.body.encryptedEntityKey || null;

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      const data = await Person.create(newPerson, { returning: true, transaction: tx });
      return data.toJSON();
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
    }

    const total = await Person.count(query);

    const limit = parseInt(req.query.limit, 10);
    if (!!req.query.limit) query.limit = limit;
    if (req.query.page) query.offset = parseInt(req.query.page, 10) * limit;

    const data = await Person.findAll({
      ...query,
      attributes: [
        // Generic fields
        "_id",
        "encrypted",
        "encryptedEntityKey",
        "organisation",
        "createdAt",
        "updatedAt",
        // This field should be encrypted but it has not been for some time.
        // It should be kept to avoid breaking existing clients.
        // It is not sensitive data, so we can keep it as is.
        "outOfActiveList",
      ],
    });

    return res.status(200).send({
      ok: true,
      hasMore: data.length === limit,
      data: data.map((person) => person.toJSON()),
      total,
    });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  catchErrors(async (req, res, next) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };

    const person = await Person.findOne(query);
    if (!person) return res.status(404).send({ ok: false, error: "Not Found" });

    const updatePerson = {};

    if (!req.body.hasOwnProperty("encrypted") || !req.body.hasOwnProperty("encryptedEntityKey")) {
      next("No encrypted field in person update");
      return res.send(403).send({ ok: false, error: "Une erreur de chiffrement est survenue. L'équipe technique a été prévenue" });
    }
    if (req.body.hasOwnProperty("encrypted")) updatePerson.encrypted = req.body.encrypted || null;
    if (req.body.hasOwnProperty("encryptedEntityKey")) updatePerson.encryptedEntityKey = req.body.encryptedEntityKey || null;
    // FIXME: This pattern should be avoided. createdAt should be updated only when it is created.
    if (req.body.hasOwnProperty("createdAt") && !!req.body.createdAt) {
      person.changed("createdAt", true);
      updatePerson.createdAt = new Date(req.body.createdAt);
<<<<<<< HEAD
    }

    if (req.body.hasOwnProperty("outOfActiveList")) {
      updatePerson.outOfActiveList = req.body.outOfActiveList;
=======
>>>>>>> ea9c72b (a few cleans)
    }

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      await Person.update(updatePerson, query, { silent: false, transaction: tx });
      const newPerson = await Person.findOne(query);
      return newPerson.toJSON();
    });

    res.status(status).send({ ok, data, error });
  })
);

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
