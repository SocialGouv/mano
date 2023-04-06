/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    ALTER TABLE "mano"."Organisation"
    ADD COLUMN IF NOT EXISTS "recryptingItemsLocally" boolean DEFAULT false;
  `);
  },
};
