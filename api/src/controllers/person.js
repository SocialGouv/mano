const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const Person = require("../models/person");
const { STORAGE_DIRECTORY } = require("../config");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const validateUser = require("../middleware/validateUser");
const { looseUuidRegex, cryptoHexRegex, positiveIntegerRegex } = require("../utils");
const { capture } = require("../sentry");

// Return the basedir to store persons' documents.
function personDocumentBasedir(userOrganisation, personId) {
  const basedir = STORAGE_DIRECTORY ? path.join(STORAGE_DIRECTORY, "uploads") : path.join(__dirname, "../../uploads");
  return path.join(basedir, `${userOrganisation}`, "persons", `${personId}`);
}

// Upload a document for a person.
router.post(
  "/:id/document",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      capture("Invalid request in document creation", { extra: { e, params: req.params }, user: req.user });
      return res.status(400).send({ ok: false, error: "Invalid request" });
    }
    next();
  }),
  // Use multer to handle the file upload.
  multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => {
        // dir is safe since it's generated by the userOrganisation and personId that has been validated.
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
  catchErrors(async (req, res, next) => {
    const { file } = req;
    // Send back file information.
    console.log({
      originalname: file.originalname,
      filename: file.filename,
      size: file.size,
      encoding: file.encoding,
      mimetype: file.mimetype,
    });
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
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        id: z.string().regex(looseUuidRegex),
        filename: z.string().regex(cryptoHexRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in document get: ${e}`);
      error.status = 400;
      return next(error);
    }
    // dir and file are safe since it's generated by the userOrganisation, personId and filename that has been validated.
    const dir = personDocumentBasedir(req.user.organisation, req.params.id);
    const file = path.join(dir, req.params.filename);
    if (!fs.existsSync(file)) {
      res.status(404).send({ ok: false, error: "Désolé, le fichier n'est plus disponible." });
    } else {
      res.sendFile(file);
    }
  })
);

// Delete a file for a person by its filename.
router.delete(
  "/:id/document/:filename",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        id: z.string().regex(looseUuidRegex),
        filename: z.string().regex(cryptoHexRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in document delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    // dir and file are safe since it's generated by the userOrganisation, personId and filename that has been validated.
    const dir = personDocumentBasedir(req.user.organisation, req.params.id);
    const file = path.join(dir, req.params.filename);
    if (!fs.existsSync(file)) {
      // if it is not found, it might not be deleted but it's still in the database, so we return ok.
      res.send({ ok: true });
    } else {
      fs.unlinkSync(file);
      res.send({ ok: true });
    }
  })
);

router.post(
  "/import",
  passport.authenticate("user", { session: false }),
  validateUser("admin"),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.array(
        z.object({
          encrypted: z.string(),
          encryptedEntityKey: z.string(),
        })
      ).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in person import: ${e}`);
      error.status = 400;
      return next(error);
    }

    const persons = req.body.map((p) => {
      const person = {
        encrypted: p.encrypted,
        encryptedEntityKey: p.encryptedEntityKey,
        organisation: req.user.organisation,
        user: req.user._id,
      };
      return person;
    });
    const data = await Person.bulkCreate(persons, { returning: true });
    return res.status(200).send({
      ok: true,
      data: data.map((p) => ({
        _id: p._id,
        encrypted: p.encrypted,
        encryptedEntityKey: p.encryptedEntityKey,
        organisation: p.organisation,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt,
      })),
    });
  })
);

router.post(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "restricted-access"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        encrypted: z.string(),
        encryptedEntityKey: z.string(),
      }).parse(req.body);
    } catch (e) {
      const error = new Error(`Invalid request in person creation: ${e}`);
      error.status = 400;
      return next(error);
    }

    const data = await Person.create(
      {
        organisation: req.user.organisation,
        encrypted: req.body.encrypted,
        encryptedEntityKey: req.body.encryptedEntityKey,
      },
      { returning: true }
    );
    return res.status(200).send({
      ok: true,
      data: {
        _id: data._id,
        encrypted: data.encrypted,
        encryptedEntityKey: data.encryptedEntityKey,
        organisation: data.organisation,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        deletedAt: data.deletedAt,
      },
    });
  })
);

router.get(
  "/",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        limit: z.optional(z.string().regex(positiveIntegerRegex)),
        page: z.optional(z.string().regex(positiveIntegerRegex)),
        after: z.optional(z.string().regex(positiveIntegerRegex)),
        withDeleted: z.optional(z.enum(["true", "false"])),
      }).parse(req.query);
    } catch (e) {
      const error = new Error(`Invalid request in person get: ${e}`);
      error.status = 400;
      return next(error);
    }
    const { limit, page, after, withDeleted } = req.query;

    const query = {
      where: { organisation: req.user.organisation },
      order: [["_id", "DESC"]],
    };

    const total = await Person.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await Person.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "createdAt", "updatedAt", "deletedAt"],
    });

    return res.status(200).send({
      ok: true,
      hasMore: data.length === Number(limit),
      data: data.map((person) => person.toJSON()),
      total,
    });
  })
);

router.put(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal", "restricted-access"]),
  validateEncryptionAndMigrations,
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        params: z.object({
          _id: z.string().regex(looseUuidRegex),
        }),
        body: z.object({
          encrypted: z.string(),
          encryptedEntityKey: z.string(),
        }),
      }).parse(req);
    } catch (e) {
      const error = new Error(`Invalid request in person put: ${e}`);
      error.status = 400;
      return next(error);
    }

    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };
    const person = await Person.findOne(query);
    if (!person) return res.status(404).send({ ok: false, error: "Not Found" });

    const { encrypted, encryptedEntityKey } = req.body;
    const updatePerson = {
      encrypted: encrypted,
      encryptedEntityKey: encryptedEntityKey,
    };

    await Person.update(updatePerson, query, { silent: false });
    const newPerson = await Person.findOne(query);

    res.status(200).send({
      ok: true,
      data: {
        _id: newPerson._id,
        encrypted: newPerson.encrypted,
        encryptedEntityKey: newPerson.encryptedEntityKey,
        organisation: newPerson.organisation,
        createdAt: newPerson.createdAt,
        updatedAt: newPerson.updatedAt,
        deletedAt: newPerson.deletedAt,
      },
    });
  })
);

router.delete(
  "/:_id",
  passport.authenticate("user", { session: false }),
  validateUser(["admin", "normal"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        _id: z.string().regex(looseUuidRegex),
      }).parse(req.params);
    } catch (e) {
      const error = new Error(`Invalid request in person delete: ${e}`);
      error.status = 400;
      return next(error);
    }
    const query = { where: { _id: req.params._id, organisation: req.user.organisation } };

    let person = await Person.findOne(query);
    if (!person) return res.status(404).send({ ok: false, error: "Not Found" });

    await person.destroy();
    res.status(200).send({ ok: true });
  })
);

module.exports = router;
