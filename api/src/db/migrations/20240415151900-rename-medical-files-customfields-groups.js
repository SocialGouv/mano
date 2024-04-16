"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Rename the column to "groupedCustomFieldsMedicalFile"
    await queryInterface.renameColumn(
      {
        tableName: "Organisation",
        schema: "mano",
      },
      "customFieldsMedicalFile",
      "groupedCustomFieldsMedicalFile"
    );
  },

  async down(queryInterface) {
    // Rename the column back to "customFieldsMedicalFile"
    await queryInterface.renameColumn(
      {
        tableName: "Organisation",
        schema: "mano",
      },
      "groupedCustomFieldsMedicalFile",
      "customFieldsMedicalFile"
    );
  },
};
