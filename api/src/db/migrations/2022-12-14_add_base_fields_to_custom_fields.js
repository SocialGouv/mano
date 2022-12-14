const { capture } = require("../../sentry");
const Organisation = require("../../models/organisation");
const sequelize = require("../sequelize");
const { customFieldsPersonsSocialBase, customFieldsPersonsMedicalBase, fixedFieldsPersonsBase } = require("../../utils/custom-fields/person");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "customFieldsPersons" JSONB DEFAULT NULL;
    `);
    const organisations = await Organisation.findAll();
    for (const organisation of organisations) {
      console.log(organisation.customFieldsPersons);
      if (!!organisation.customFieldsPersons) continue;
      organisation.set({
        customFieldsPersons: [
          { name: "Résumé", fields: fixedFieldsPersonsBase },
          { name: "Informations sociales", fields: [...customFieldsPersonsSocialBase, ...(organisation.customFieldsPersonsSocial || [])] },
          { name: "Informations médicales", fields: [...customFieldsPersonsMedicalBase, ...(organisation.customFieldsPersonsMedical || [])] },
        ],
        migrationLastUpdateAt: new Date(),
      });
      await organisation.save();
    }
  } catch (e) {
    capture(e);
  }
};
