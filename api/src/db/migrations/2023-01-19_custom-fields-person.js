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
      if (organisation.migrations?.includes("custom-fields-persons-setup")) continue;
      organisation.set({
        customFieldsPersonsSocial: (organisation.customFieldsPersonsSocial || []).concat(defaultSocialCustomFields),
        customFieldsPersonsMedical: (
          organisation.customFieldsPersonsMedical || defaultMedicalCustomFields.filter((e) => defaultMedicalFieldNameBeforeMigration.includes(e.name))
        ).concat(defaultMedicalCustomFields.filter((e) => !defaultMedicalFieldNameBeforeMigration.includes(e.name))),
        migrationLastUpdateAt: new Date(),
        migrations: [...(organisation.migrations || []), "custom-fields-persons-setup"],
      });
      await organisation.save();
    }
  } catch (e) {
    capture(e);
  }
};
