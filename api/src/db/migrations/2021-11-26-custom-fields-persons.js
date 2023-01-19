const { capture } = require("../../sentry");
const { defaultSocialCustomFields } = require("../../utils/custom-fields/person");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(
      `
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "customFieldsPersonsSocial" jsonb :defaultValue;
      `,
      { replacements: { defaultValue: JSON.stringify(defaultSocialCustomFields) } }
    );
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "customFieldsPersonsMedical" jsonb;
    `);
  } catch (e) {
    capture(e);
  }
};
