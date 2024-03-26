"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Rename the column to "groupedCustomFieldsObs"
    await queryInterface.renameColumn(
      {
        tableName: "Organisation",
        schema: "mano",
      },
      "customFieldsObs",
      "groupedCustomFieldsObs"
    );
  },

  async down(queryInterface) {
    // Rename the column back to "customFieldsObs"
    await queryInterface.renameColumn(
      {
        tableName: "Organisation",
        schema: "mano",
      },
      "groupedCustomFieldsObs",
      "customFieldsObs"
    );
  },
};
