const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "migrations" TEXT[] DEFAULT ARRAY['custom-fields-persons-setup'];
    `);
  } catch (e) {
    capture(e);
  }
};
