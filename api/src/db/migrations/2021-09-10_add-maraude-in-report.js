const sequelize = require("../sequelize");

sequelize.query(`
  ALTER TABLE "mano"."Organisation"
  ADD COLUMN IF NOT EXISTS "collaborations" text[];
`);
