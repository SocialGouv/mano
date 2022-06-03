const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Team"
      ADD COLUMN IF NOT EXISTS "nightSession" boolean DEFAULT false;
    `);
  } catch (e) {
    capture(e);
  }
};
