"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Move categories to actionsGroupedCategories when actionsGroupedCategories is null
    // Next step will be to get rid of "categories" in code.
    // And later, we will remove the column "categories" from the database.
    await queryInterface.sequelize.query(`
      UPDATE mano."Organisation"
      SET "actionsGroupedCategories" = json_build_array(
        jsonb_build_object(
          'groupTitle', 'Toutes mes catégories',
          'categories', "categories"
        )
      )
      WHERE "categories" IS NOT NULL and "actionsGroupedCategories" IS NULL;
    `);
  },

  async down() {
    // No down
  },
};
