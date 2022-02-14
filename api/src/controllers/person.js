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
  catchErrors(async (req, res) => {
    const newPerson = {};

    newPerson.organisation = req.user.organisation;
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
        // These fields should be encrypted but it seems they are not for some reason.
        // We have to keep them, then find a solution to re-encrypt them all then drop them.
        // This will be hard to maintain.
        "outOfActiveList", // Should have been stored in encrypted fields.
        // "vulnerabilities" and "consumptions" were removed but should have been previously encrypted.
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
  catchErrors(async (req, res) => {
    const query = {
      where: {
        _id: req.params._id,
        organisation: req.user.organisation,
      },
    };

    const person = await Person.findOne(query);
    if (!person) return res.status(404).send({ ok: false, error: "Not Found" });

    // Todo: change this since createdAt should not be used for update.
    if (req.body.createdAt) {
      person.changed("createdAt", true);
      req.body.createdAt = new Date(req.body.createdAt);
    } else {
      req.body.createdAt = person.createdAt;
    }

    const { ok, data, error, status } = await encryptedTransaction(req)(async (tx) => {
      await Person.update(req.body, query, { silent: false, transaction: tx });
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
