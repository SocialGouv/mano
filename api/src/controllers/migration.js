const express = require("express");
const router = express.Router();
const passport = require("passport");
const crypto = require("crypto");
const { z } = require("zod");
const { catchErrors } = require("../errors");
const validateEncryptionAndMigrations = require("../middleware/validateEncryptionAndMigrations");
const { looseUuidRegex, isoDateRegex } = require("../utils");
const { capture } = require("../sentry");
const validateUser = require("../middleware/validateUser");
const { serializeOrganisation } = require("../utils/data-serializer");
const {
  Organisation,
  Person,
  Action,
  Comment,
  Consultation,
  Treatment,
  MedicalFile,
  Place,
  Report,
  Team,
  User,
  RelUserTeam,
  RelPersonPlace,
  Passage,
  TerritoryObservation,
  Territory,
  Rencontre,
  sequelize,
  Group,
} = require("../db/sequelize");

router.put(
  "/:migrationName",
  passport.authenticate("user", { session: false }),
  validateEncryptionAndMigrations,
  validateUser(["admin", "normal", "restricted-access"]),
  catchErrors(async (req, res, next) => {
    try {
      z.object({
        user: z.object({
          organisation: z.string().regex(looseUuidRegex),
        }),
        params: z.object({
          migrationName: z.string().min(1),
        }),
      }).parse(req);
    } catch (e) {
      const error = new Error(`Invalid request in migration: ${e}`);
      error.status = 400;
      return next(error);
    }

    const organisation = await Organisation.findOne({ where: { _id: req.user.organisation } });
    if (!organisation) return res.status(404).send({ ok: false, error: "Not Found" });
    organisation.set({ migrating: true });
    await organisation.save();

    try {
      await sequelize.transaction(async (tx) => {
        /*
        // Example of migration:
        if (req.params.migrationName === "migration-name") {
          try {
            z.array(z.string().regex(looseUuidRegex)).parse(req.body.thingsIdsToDestroy);
            z.array(
              z.object({
                _id: z.string().regex(looseUuidRegex),
                encrypted: z.string(),
                encryptedEntityKey: z.string(),
              })
            ).parse(req.body.thingsToUpdate);
          } catch (e) {
            const error = new Error(`Invalid request in migration-name: ${e}`);
            error.status = 400;
            throw error;
          }
          for (const _id of req.body.thingsIdsToDestroy) {
            await Thing.destroy({ where: { _id, organisation: req.user.organisation }, transaction: tx });
          }
          for (const { _id, encrypted, encryptedEntityKey } of req.body.thingsToUpdate) {
            await Thing.update({ encrypted, encryptedEntityKey }, { where: { _id }, transaction: tx, paranoid: false });
          }
          organisation.set({
            migrations: [...(organisation.migrations || []), req.params.migrationName],
            migrationLastUpdateAt: new Date(),
          });
        }
        // End of example of migration.
         */
        if (req.params.migrationName === "truplicate-organisations") {
          try {
            const encryptedItemFields = z.object({
              _id: z.string().regex(looseUuidRegex),
              organisation: z.string().regex(looseUuidRegex),
              createdAt: z.string().regex(isoDateRegex),
              updatedAt: z.string().regex(isoDateRegex),
              deletedAt: z.string().regex(isoDateRegex).nullable().optional(),
              encrypted: z.string(),
              encryptedEntityKey: z.string(),
            });

            const nextOrganisation = z.object({
              organisationId: z.string().regex(looseUuidRegex),
              teams: z.array(
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  name: z.string(),
                  nightSession: z.boolean(),
                  organisation: z.string().regex(looseUuidRegex),
                })
              ),
              users: z.array(
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  email: z.string().email(),
                  organisation: z.string().regex(looseUuidRegex),
                  role: z.enum(["admin", "normal", "restricted-access"]),
                  name: z.string().optional(),
                  phone: z.string().optional(),
                  healthcareProfessional: z.boolean().optional(),
                })
              ),
              relUserTeams: z.array(
                z.object({
                  _id: z.string().regex(looseUuidRegex),
                  user: z.string().regex(looseUuidRegex),
                  team: z.string().regex(looseUuidRegex),
                })
              ),
              persons: z.array(encryptedItemFields),
              consultations: z.array(encryptedItemFields),
              treatments: z.array(encryptedItemFields),
              medicalFiles: z.array(encryptedItemFields),
              actions: z.array(encryptedItemFields),
              groups: z.array(encryptedItemFields),
              comments: z.array(encryptedItemFields),
              passages: z.array(encryptedItemFields),
              rencontres: z.array(encryptedItemFields),
              territories: z.array(encryptedItemFields),
              observations: z.array(encryptedItemFields),
              places: z.array(encryptedItemFields),
              relsPersonPlace: z.array(encryptedItemFields),
              reports: z.array(encryptedItemFields),
            });

            nextOrganisation.parse(req.body.organisation1);
            nextOrganisation.parse(req.body.organisation2);
          } catch (e) {
            const error = new Error(`Invalid request in truplicate-organisations: ${e}`);
            error.status = 400;
            throw error;
          }
          const saveOrganisation = async (newOrganisation) => {
            for (let item of newOrganisation.teams) {
              await Team.create(item, { transaction: tx });
            }

            const password = crypto.randomBytes(60).toString("hex"); // A useless password.,
            const forgotPasswordResetExpires = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000); // 30 days
            for (let item of newOrganisation.users) {
              item.email = item.email.toLocaleLowerCase();
              item.forgotPasswordResetToken = crypto.randomBytes(20).toString("hex");
              item.forgotPasswordResetExpires = forgotPasswordResetExpires;
              item.password = password;
              await User.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.relUserTeams) {
              await RelUserTeam.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.persons) {
              await Person.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.groups) {
              await Group.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.actions) {
              await Action.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.consultations) {
              await Consultation.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.treatments) {
              await Treatment.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.medicalFiles) {
              await MedicalFile.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.comments) {
              await Comment.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.passages) {
              await Passage.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.rencontres) {
              await Rencontre.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.territories) {
              await Territory.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.observations) {
              await TerritoryObservation.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.places) {
              await Place.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.relsPersonPlace) {
              await RelPersonPlace.create(item, { transaction: tx });
            }

            for (let item of newOrganisation.reports) {
              await Report.create(item, { transaction: tx });
            }
          };

          const organisation1 = await Organisation.findOne({ where: { _id: req.body.organisation1.organisationId } });
          const organisation2 = await Organisation.findOne({ where: { _id: req.body.organisation2.organisationId } });
          if (!organisation1 || !organisation2) return res.status(404).send({ ok: false, error: "Not Found" });
          await saveOrganisation(req.body.organisation1);
          await saveOrganisation(req.body.organisation2);
          organisation.set({
            migrations: [...(organisation.migrations || []), req.params.migrationName],
            migrationLastUpdateAt: new Date(),
          });
        }

        organisation.set({ migrating: false });
        await organisation.save({ transaction: tx });
      });
    } catch (e) {
      capture("error migrating", e);
      organisation.set({ migrating: false });
      await organisation.save();
      return next(e);
    }
    return res.status(200).send({
      ok: true,
      organisation: serializeOrganisation(organisation),
    });
  })
);

module.exports = router;
