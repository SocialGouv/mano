const { capture } = require("../../sentry");
const Organisation = require("../../models/organisation");
const sequelize = require("../sequelize");
const {
  customFieldsPersonsSocialBase,
  customFieldsPersonsMedicalBase,
  fixedFieldsPersonsBase,
  defaultFieldsPersons,
} = require("../../utils/custom-fields/person");

const json = JSON.stringify(defaultFieldsPersons);

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "customFieldsPersons" JSONB DEFAULT $$${json}$$::JSONB;
    `);
    const organisations = await Organisation.findAll();
    for (const organisation of organisations) {
      if (organisation.migrations?.includes("custom-fields-persons-setup")) continue;
      organisation.set({
        customFieldsPersons: [
          { name: "Résumé", fields: fixedFieldsPersonsBase },
          { name: "Informations sociales", fields: [...customFieldsPersonsSocialBase, ...(organisation.customFieldsPersonsSocial || [])] },
          { name: "Informations médicales", fields: [...customFieldsPersonsMedicalBase, ...(organisation.customFieldsPersonsMedical || [])] },
        ],
        migrationLastUpdateAt: new Date(),
        migrations: [...(organisation.migrations || []), "custom-fields-persons-setup"],
      });
      await organisation.save();
    }
  } catch (e) {
    capture(e);
  }
};
