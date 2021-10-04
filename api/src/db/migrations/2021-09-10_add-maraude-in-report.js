const sequelize = require("../sequelize");

sequelize.query(`
  ALTER TABLE "mano"."Report"
  ADD COLUMN IF NOT EXISTS "collaboration" text;
  ALTER TABLE "mano"."Organisation"
  ADD COLUMN IF NOT EXISTS "collaborations" text[];
`);
