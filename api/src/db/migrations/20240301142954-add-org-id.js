"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE "mano"."Organisation" ADD COLUMN "orgId" TEXT;');

    await queryInterface.sequelize.query('UPDATE "mano"."Organisation" SET "orgId" = "name";');
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('ALTER TABLE "mano"."Organisation" DROP COLUMN "orgId";');
  },
};
