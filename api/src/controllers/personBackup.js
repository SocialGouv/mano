const express = require("express");
const router = express.Router();
const passport = require("passport");
const { Op } = require("sequelize");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const { PersonBackup } = require("../db/sequelize");
const validateUser = require("../middleware/validateUser");
const { positiveIntegerRegex } = require("../utils");

/*

Nécessite de créer manuellement cette table et de la remplir.

CREATE TABLE mano."PersonBackup" (
  "_id" uuid NOT NULL,
  organisation uuid NULL,
  "createdAt" timestamptz NOT NULL,
  "updatedAt" timestamptz NOT NULL,
  "encrypted" text NULL,
  "encryptedEntityKey" text NULL,
  "deletedAt" timestamptz NULL,
  CONSTRAINT "PersonBackup_pkey" PRIMARY KEY (_id)
);

CREATE INDEX personbackup_deletedat_idx ON mano."PersonBackup" USING btree ("deletedAt");
CREATE INDEX personbackup_organisation_idx ON mano."PersonBackup" USING btree (organisation);
CREATE INDEX personbackup_updatedat_idx ON mano."PersonBackup" USING btree ("updatedAt");

ALTER TABLE mano."PersonBackup" ADD CONSTRAINT "PersonBackup_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"("_id") ON DELETE CASCADE ON UPDATE CASCADE DEFERRABLE;
*/

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

    const total = await PersonBackup.count(query);
    if (limit) query.limit = Number(limit);
    if (page) query.offset = Number(page) * limit;
    if (withDeleted === "true") query.paranoid = false;
    if (after && !isNaN(Number(after)) && withDeleted === "true") {
      query.where[Op.or] = [{ updatedAt: { [Op.gte]: new Date(Number(after)) } }, { deletedAt: { [Op.gte]: new Date(Number(after)) } }];
    } else if (after && !isNaN(Number(after))) {
      query.where.updatedAt = { [Op.gte]: new Date(Number(after)) };
    }

    const data = await PersonBackup.findAll({
      ...query,
      attributes: ["_id", "encrypted", "encryptedEntityKey", "organisation", "createdAt", "updatedAt", "deletedAt"],
    });

    return res.status(200).send({
      ok: true,
      hasMore: data.length === Number(limit),
      data: data.map((personBackup) => personBackup.toJSON()),
      total,
    });
  })
);

module.exports = router;
