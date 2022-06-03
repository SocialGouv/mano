const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."User"
      ADD COLUMN IF NOT EXISTS "debugApp" jsonb,
      ADD COLUMN IF NOT EXISTS "debugDashboard" jsonb;
    `);
  } catch (e) {
    capture(e);
  }
};
