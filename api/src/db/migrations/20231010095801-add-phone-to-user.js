"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "mano"."User"
      ADD COLUMN IF NOT EXISTS "phone" text;
  `);
  },

  async down() {
    // Qui fait des down, et pourquoi ?
  },
};
