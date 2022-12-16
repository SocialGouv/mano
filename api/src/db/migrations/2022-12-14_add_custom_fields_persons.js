const { capture } = require("../../sentry");
const Organisation = require("../../models/organisation");
const sequelize = require("../sequelize");
const {
  customFieldsPersonsSocialBase,
  customFieldsPersonsMedicalBase,
  customFieldsPersonsSummaryBase,
  defaultFieldsPersons,
} = require("../../utils/custom-fields/person");

const customFieldsPersonsSocialBaseNames = customFieldsPersonsSocialBase.map((f) => f.name);
const customFieldsPersonsMedicalBaseNames = customFieldsPersonsMedicalBase.map((f) => f.name);

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "customFieldsPersons" JSONB DEFAULT $$${JSON.stringify(defaultFieldsPersons)}$$::JSONB;
    `);
    const organisations = await Organisation.findAll();
    for (const organisation of organisations) {
      if (organisation.migrations?.includes("custom-fields-persons-setup")) continue;
      organisation.set({
        customFieldsPersons: [
          { name: "Résumé", fields: customFieldsPersonsSummaryBase },
          {
            name: "Informations sociales",
            fields: [
              ...customFieldsPersonsSocialBase,
              ...(organisation.customFieldsPersonsSocial || []).filter((field) => !customFieldsPersonsSocialBaseNames.includes(field.name)),
            ],
          },
          {
            name: "Informations médicales",
            fields: [
              ...customFieldsPersonsMedicalBase,
              ...(organisation.customFieldsPersonsMedical || []).filter((field) => !customFieldsPersonsMedicalBaseNames.includes(field.name)),
            ],
          },
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
