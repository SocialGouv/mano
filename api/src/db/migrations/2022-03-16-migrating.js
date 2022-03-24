const sequelize = require("../sequelize");

sequelize.query(`
  ALTER TABLE "mano"."Organisation"
  ADD COLUMN IF NOT EXISTS "migrating" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "migrationLastUpdateAt" timestamp with time zone;
`);
