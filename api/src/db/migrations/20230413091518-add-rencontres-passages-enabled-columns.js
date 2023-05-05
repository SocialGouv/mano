"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    ALTER TABLE "mano"."Organisation"
    ADD COLUMN IF NOT EXISTS "passagesEnabled" boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS "rencontresEnabled" boolean DEFAULT true;

  `);
  },

  //async down(queryInterface, Sequelize) {
  //  await queryInterface.removeColumn("Organisation", "passagesEnabled");
  //  await queryInterface.removeColumn("Organisation", "rencontresEnabled");
  //},
};
