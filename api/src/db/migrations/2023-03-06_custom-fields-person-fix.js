const { capture } = require("../../sentry");
const Organisation = require("../../models/organisation");
const { defaultSocialCustomFields, defaultMedicalCustomFields } = require("../../utils/custom-fields/person");

module.exports = async () => {
  try {
    const organisations = await Organisation.findAll();
    // Before this migration, there were already some default medical custom fields.
    // These fields could have been modified or deleted by the user, so we don't want to re-import them.
    // Still, we want to add the new default medical custom fields.
    // So, when there is a totally empty medical custom fields array, we *assume* that the platform is
    // new and we add all the default medical custom fields.
    // Otherwise, we only add the new default medical custom fields.
    //
    // The downside of this approach is that if the user has deleted all the default medical custom fields,
    // they will be re-added. But this is a rare case and it's not worth the effort to handle it.
    const defaultMedicalFieldNameBeforeMigration = ["consumptions", "vulnerabilities", "caseHistoryTypes", "caseHistoryDescription"];

    for (const organisation of organisations) {
      if (organisation.migrations?.includes("custom-fields-persons-fix")) continue;

      const customFieldsPersonsSocial = [...(organisation.customFieldsPersonsSocial || []), ...defaultSocialCustomFields];

      const customFieldsPersonsMedical = [
        ...(organisation.customFieldsPersonsMedical ||
          defaultMedicalCustomFields.filter((e) => defaultMedicalFieldNameBeforeMigration.includes(e.name))),
        ...defaultMedicalCustomFields.filter((e) => !defaultMedicalFieldNameBeforeMigration.includes(e.name)),
      ];

      organisation.set({
        customFieldsPersons: [
          {
            name: "Informations sociales",
            fields: customFieldsPersonsSocial,
          },
          {
            name: "Informations médicales",
            fields: customFieldsPersonsMedical,
          },
        ],
        migrationLastUpdateAt: new Date(),
        migrations: [...(organisation.migrations || []), "custom-fields-persons-fix"],
      });
      await organisation.save();
    }
  } catch (e) {
    capture(e);
  }
};
