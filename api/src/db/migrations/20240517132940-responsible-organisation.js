"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE "mano"."Organisation" ADD COLUMN "responsible" TEXT;');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE "mano"."Organisation" DROP COLUMN "responsible";');
  },
};
