const { capture } = require("../../sentry");
const { defaultSocialCustomFields, defaultMedicalCustomFields } = require("../../utils/custom-fields/person");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`ALTER TABLE "mano"."Organisation" ADD COLUMN IF NOT EXISTS "customFieldsPersons" jsonb default :defaultValue;`, {
      replacements: {
        defaultValue: JSON.stringify([
          {
            name: "Informations sociales",
            fields: defaultSocialCustomFields,
          },
          {
            name: "Informations médicales",
            fields: defaultMedicalCustomFields,
          },
        ]),
      },
    });
  } catch (e) {
    capture(e);
  }
};
