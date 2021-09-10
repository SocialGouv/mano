const sequelize = require("../sequelize");

sequelize.query(`
  ALTER TABLE "mano"."RelPersonPlace"
  ADD COLUMN IF NOT EXISTS "encrypted" text,
  ADD COLUMN IF NOT EXISTS "encryptedEntityKey" text;
`);
