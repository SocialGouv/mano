const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "migrating" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "migrationLastUpdateAt" timestamp with time zone;
    `);
  } catch (e) {
    capture(e);
  }
};
