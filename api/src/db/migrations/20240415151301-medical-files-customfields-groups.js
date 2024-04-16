"use strict";

const { QueryTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      const rows = await queryInterface.sequelize.query(
        'SELECT _id, "customFieldsMedicalFile" FROM "mano"."Organisation" where "customFieldsMedicalFile" is not null',
        {
          type: QueryTypes.SELECT,
          transaction: t,
        }
      );

      for (const row of rows) {
        const updatedCustomFieldsMedicalFile = [{ name: "Groupe par défaut", fields: row.customFieldsMedicalFile || [] }];

        await queryInterface.sequelize.query(
          `UPDATE "mano"."Organisation" SET "customFieldsMedicalFile" = :updatedCustomFieldsMedicalFile WHERE _id = :_id`,
          {
            type: QueryTypes.UPDATE,
            replacements: { updatedCustomFieldsMedicalFile: JSON.stringify(updatedCustomFieldsMedicalFile), _id: row._id },
            transaction: t,
          }
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      const rows = await queryInterface.sequelize.query('SELECT _id, "customFieldsMedicalFile" FROM "mano"."Organisation"', {
        type: QueryTypes.SELECT,
        transaction: t,
      });

      for (const row of rows) {
        // Assuming there's only one object in the array after the up migration,
        // and that object has the structure { name: "Groupe par défaut", fields: [...] }
        const originalCustomFieldsMedicalFile = row.customFieldsMedicalFile[0]?.fields || [];

        await queryInterface.sequelize.query(
          `UPDATE "mano"."Organisation" SET "customFieldsMedicalFile" = :originalCustomFieldsMedicalFile WHERE _id = :_id`,
          {
            type: QueryTypes.UPDATE,
            replacements: { originalCustomFieldsMedicalFile: JSON.stringify(originalCustomFieldsMedicalFile), _id: row._id },
            transaction: t,
          }
        );
      }
    });
  },
};
