const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."User"
      ADD COLUMN IF NOT EXISTS "gaveFeedbackEarly2023" boolean;
    `);
  } catch (e) {
    capture(e);
  }
};
