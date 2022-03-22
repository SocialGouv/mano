const sequelize = require("../sequelize");

sequelize.query(`
  CREATE TABLE IF NOT EXISTS "mano"."Passage" (
    "_id" uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "organisation" uuid,
    "encrypted" text,
    "encryptedEntityKey" text,
    PRIMARY KEY ("_id"),
    CONSTRAINT "Passage_organisation_fkey" FOREIGN KEY ("organisation") REFERENCES "mano"."Organisation"("_id") ON DELETE CASCADE ON UPDATE CASCADE
  );
`);
