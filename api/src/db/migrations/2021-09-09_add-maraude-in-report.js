const sequelize = require("../sequelize");

sequelize.query(`
  ALTER TABLE "mano"."User"
  ADD COLUMN IF NOT EXISTS "termsAccepted" timestamp with time zone;
`);
