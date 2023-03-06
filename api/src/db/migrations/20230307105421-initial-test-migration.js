/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // This migration is just a test to see if we can use sequelize-cli to create migrations.
    await queryInterface.sequelize.query("SELECT 1", { type: Sequelize.QueryTypes.SELECT });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.sequelize.query("SELECT 1", { type: Sequelize.QueryTypes.SELECT });
  },
};
