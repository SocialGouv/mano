"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
        ALTER TABLE "mano"."User"
        ADD COLUMN IF NOT EXISTS "cgusAccepted" TIMESTAMP WITH TIME ZONE;
    `);
  },

  async down() {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
