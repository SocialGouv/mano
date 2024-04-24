"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
    ALTER TABLE "mano"."Organisation"
    ADD COLUMN IF NOT EXISTS "checkboxShowAllOrgaPersons" boolean DEFAULT true;

  `);
  },

  //async down(queryInterface, Sequelize) {
  //  await queryInterface.removeColumn("Organisation", "passagesEnabled");
  //  await queryInterface.removeColumn("Organisation", "rencontresEnabled");
  //},
};
