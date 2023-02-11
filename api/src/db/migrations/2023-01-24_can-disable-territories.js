const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "territoriesEnabled" boolean DEFAULT true;
    `);
  } catch (e) {
    capture(e);
  }
};