const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Report"
      ADD COLUMN IF NOT EXISTS "debug" jsonb;
    `);
  } catch (e) {
    capture(e);
  }
};
