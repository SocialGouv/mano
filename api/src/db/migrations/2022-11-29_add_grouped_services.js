const sequelize = require("../sequelize");
const { capture } = require("../../sentry");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "groupedServices" jsonb;
    `);
  } catch (e) {
    capture(e);
  }
};