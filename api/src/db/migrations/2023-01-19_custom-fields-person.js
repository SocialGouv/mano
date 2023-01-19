const { capture } = require("../../sentry");
const Organisation = require("../../models/organisation");
const sequelize = require("../sequelize");
const { defaultSocialCustomFields } = require("../../utils/custom-fields/person");

module.exports = async () => {
  try {
    const organisations = await Organisation.findAll();
    for (const organisation of organisations) {
      if (organisation.migrations?.includes("custom-fields-persons-setup")) continue;
      organisation.set({
        customFieldsPersonsSocial: (organisation.customFieldsPersonsSocial || []).concat(defaultSocialCustomFields),
        migrationLastUpdateAt: new Date(),
        migrations: [...(organisation.migrations || []), "custom-fields-persons-setup"],
      });
      await organisation.save();
    }
  } catch (e) {
    capture(e);
  }
};
