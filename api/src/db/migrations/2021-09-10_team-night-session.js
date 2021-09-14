const sequelize = require("../sequelize");

sequelize.query(`
  ALTER TABLE "mano"."Team"
  ADD COLUMN IF NOT EXISTS "nightSession" boolean DEFAULT false;
`);
