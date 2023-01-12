const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."User"
      ADD COLUMN IF NOT EXISTS "termsAccepted" timestamp with time zone;
    `);
  } catch (e) {
    capture(e);
  }
};