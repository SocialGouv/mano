const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."RelPersonPlace"
      ADD COLUMN IF NOT EXISTS "encrypted" text,
      ADD COLUMN IF NOT EXISTS "encryptedEntityKey" text;
    `);
  } catch (e) {
    capture(e);
  }
};
