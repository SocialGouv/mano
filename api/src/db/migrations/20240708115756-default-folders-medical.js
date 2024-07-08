"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN "defaultMedicalFolders" JSONB DEFAULT '[]' NOT NULL;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      DROP COLUMN "defaultMedicalFolders";
    `);
  },
};
