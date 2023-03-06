const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    // These migrations are set by default to avoid running the same code twice
    // in 2023-01-19_custom-fields-person.js and in 2023-02-28_refacto-custom-fields-person.js
    //
    // 1. If the organisation already exists, it won't have the 'custom-fields-persons-setup' migration by default
    //    so the script can execut to migrate existing custom fields to the customFieldsPersons.
    // 2. If the organisation is new, it will have the `customPersonsFields by default so it won't need
    //    the 'custom-fields-persons-setup' migration, that's why we setup as default migration here.
    //
    // Note(2023-02-07): This migration is useless since the column is not re-created in production.
    //                   'custom-fields-persons-setup' has to be added when the organisation is created.
    //
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "migrations" text[] default array['custom-fields-persons-setup', 'custom-fields-persons-refacto-regroup'];
    `);
  } catch (e) {
    capture(e);
  }
};
