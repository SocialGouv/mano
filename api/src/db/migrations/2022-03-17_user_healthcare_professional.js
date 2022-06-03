const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

// I choose the longest one to make it clearer.
// About traduction: https://en.wikipedia.org/wiki/Health_professional

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."User"
      ADD COLUMN IF NOT EXISTS "healthcareProfessional" boolean DEFAULT false;
    `);
  } catch (e) {
    capture(e);
  }
};
