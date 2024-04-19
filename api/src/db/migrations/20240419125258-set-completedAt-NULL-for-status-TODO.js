"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /* Le jour où cette migration est écrite, 111 actions ont un status A FAIRE et une date `completedAt` existante, les dernières étant créées en mars 2024 */
    queryInterface.sequelize.query(`
    UPDATE mano."Action"
    SET "completedAt" = NULL
    WHERE status = 'A FAIRE';
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
