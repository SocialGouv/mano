const sequelize = require("../sequelize");

// About traduction: https://en.wikipedia.org/wiki/Health_professional
// I choose the longest one to make it clearer.
sequelize.query(`
  ALTER TABLE "mano"."User"
  ADD COLUMN IF NOT EXISTS "healthcareProfessional" boolean DEFAULT false;
`);
