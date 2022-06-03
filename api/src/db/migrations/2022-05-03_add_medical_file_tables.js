const sequelize = require("../sequelize");
const { capture } = require("../../sentry");

module.exports = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mano"."Consultation" (
        "_id" uuid,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        "dueAt" timestamp with time zone NOT NULL,
        "completedAt" timestamp with time zone,
        "deletedAt" timestamp with time zone,
        "status" text,
        "organisation" uuid,
        "onlyVisibleBy" uuid[],
        "encrypted" text,
        "encryptedEntityKey" text,
        PRIMARY KEY ("_id"),
        CONSTRAINT "Consultation_organisation_fkey" FOREIGN KEY ("organisation") REFERENCES "mano"."Organisation"("_id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "mano"."Treatment" (
        "_id" uuid,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        "deletedAt" timestamp with time zone,
        "organisation" uuid,
        "encrypted" text,
        "encryptedEntityKey" text,
        PRIMARY KEY ("_id"),
        CONSTRAINT "Treatment_organisation_fkey" FOREIGN KEY ("organisation") REFERENCES "mano"."Organisation"("_id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "mano"."MedicalFile" (
        "_id" uuid,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        "deletedAt" timestamp with time zone,
        "organisation" uuid,
        "encrypted" text,
        "encryptedEntityKey" text,
        PRIMARY KEY ("_id"),
        CONSTRAINT "MedicalFile_organisation_fkey" FOREIGN KEY ("organisation") REFERENCES "mano"."Organisation"("_id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "customFieldsMedicalFile" jsonb;
    `);
  } catch (e) {
    capture(e);
  }
};
