const { capture } = require("../../sentry");
const sequelize = require("../sequelize");
const { defaultSocialCustomFields, defaultMedicalCustomFields } = require("../../utils/custom-fields/person");

module.exports = async () => {
  try {
    const organisations = await sequelize.query('SELECT * FROM "mano"."Organisation"', { type: sequelize.QueryTypes.SELECT });
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
      await sequelize.query(
        `UPDATE "mano"."Organisation" SET "customFieldsPersonsSocial"=:customFieldsPersonsSocial, "customFieldsPersonsMedical"=:customFieldsPersonsMedical, "migrationLastUpdateAt"=:migrationLastUpdateAt, "migrations"=:migrations WHERE "_id"=:_id`,
        {
          replacements: {
            customFieldsPersonsSocial: (organisation.customFieldsPersonsSocial || []).concat(defaultSocialCustomFields),
            customFieldsPersonsMedical: (
              organisation.customFieldsPersonsMedical ||
              defaultMedicalCustomFields.filter((e) => defaultMedicalFieldNameBeforeMigration.includes(e.name))
            ).concat(defaultMedicalCustomFields.filter((e) => !defaultMedicalFieldNameBeforeMigration.includes(e.name))),
            migrationLastUpdateAt: new Date(),
            migrations: [...(organisation.migrations || []), "custom-fields-persons-setup"],
            _id: organisation._id,
          },
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    }
  } catch (e) {
    capture(e);
  }
};
