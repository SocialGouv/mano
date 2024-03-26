"use strict";

const { QueryTypes } = require("sequelize");

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      const rows = await queryInterface.sequelize.query(
        'SELECT _id, "customFieldsObs" FROM "mano"."Organisation" where "customFieldsObs" is not null',
        {
          type: QueryTypes.SELECT,
          transaction: t,
        }
      );

      for (const row of rows) {
        const updatedCustomFieldsObs = [{ name: "Groupe par défaut", fields: row.customFieldsObs || [] }];

        await queryInterface.sequelize.query(`UPDATE "mano"."Organisation" SET "customFieldsObs" = :updatedCustomFieldsObs WHERE _id = :_id`, {
          type: QueryTypes.UPDATE,
          replacements: { updatedCustomFieldsObs: JSON.stringify(updatedCustomFieldsObs), _id: row._id },
          transaction: t,
        });
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      const rows = await queryInterface.sequelize.query('SELECT _id, "customFieldsObs" FROM "mano"."Organisation"', {
        type: QueryTypes.SELECT,
        transaction: t,
      });

      for (const row of rows) {
        // Assuming there's only one object in the array after the up migration,
        // and that object has the structure { name: "Groupe par défaut", fields: [...] }
        const originalCustomFieldsObs = row.customFieldsObs[0]?.fields || [];

        await queryInterface.sequelize.query(`UPDATE "mano"."Organisation" SET "customFieldsObs" = :originalCustomFieldsObs WHERE _id = :_id`, {
          type: QueryTypes.UPDATE,
          replacements: { originalCustomFieldsObs: JSON.stringify(originalCustomFieldsObs), _id: row._id },
          transaction: t,
        });
      }
    });
  },
};
