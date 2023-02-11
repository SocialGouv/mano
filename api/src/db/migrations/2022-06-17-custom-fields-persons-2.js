const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "fieldsPersonsCustomizableOptions" jsonb;
    `);
  } catch (e) {
    capture(e);
  }
};