const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    // the 'custom-fields-persons-setup' is here because
    // we setup customFieldsPersons in 2022-12-14_add_custom_fields_persons.js and those migrations are run on every deployment
    // so that's the best way I found to avoid running the same code twice in 2022-12-14_add_custom_fields_persons.js
    // 1. if the organisation is existing already, it won't have the 'custom-fields-persons-setup' migration by default
    // so the script can execut to migrate existing cutom fields to the customFieldsPersons
    // 2. if the organisation is new, it will have the `customPersonsFields by default
    // so it won't need the 'custom-fields-persons-setup' migration, that's why we setup as default migration here

    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "migrations" TEXT[] DEFAULT ARRAY['custom-fields-persons-setup'];
    `);
  } catch (e) {
    capture(e);
  }
};
