"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE mano."UserLog"
      DROP CONSTRAINT IF EXISTS "UserLog_organisation_fkey",
      DROP CONSTRAINT IF EXISTS "UserLog_user_fkey";
    `);
  },

  async down() {
    // Code to re-add constraints and indices if needed.
  },
};
