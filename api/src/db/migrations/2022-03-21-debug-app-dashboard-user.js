const sequelize = require("../sequelize");

sequelize.query(`
  ALTER TABLE "mano"."User"
  ADD COLUMN IF NOT EXISTS "debugApp" jsonb,
  ADD COLUMN IF NOT EXISTS "debugDashboard" jsonb;
`);
