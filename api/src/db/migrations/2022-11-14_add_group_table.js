const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "mano"."Group" (
        "_id" uuid,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        "organisation" uuid,
        "encrypted" text,
        "encryptedEntityKey" text,
        "deletedAt" timestamp with time zone,
        PRIMARY KEY ("_id"),
        CONSTRAINT "Group_organisation_fkey" FOREIGN KEY ("organisation") REFERENCES "mano"."Organisation"("_id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
  } catch (e) {
    capture(e);
  }
};
