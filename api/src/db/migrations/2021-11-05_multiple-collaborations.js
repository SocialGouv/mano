const sequelize = require("../sequelize");

sequelize.query(`
  ALTER TABLE "mano"."Report"
  ADD COLUMN IF NOT EXISTS "collaborations" text[],
  DROP COLUMN IF EXISTS "collaboration";
`);
