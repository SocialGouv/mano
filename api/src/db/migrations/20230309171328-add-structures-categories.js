/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    ALTER TABLE "mano"."Organisation"
    ADD COLUMN IF NOT EXISTS "structuresGroupedCategories" jsonb;
  `);
    const [organisations] = await queryInterface.sequelize.query(`
    SELECT * FROM "mano"."Organisation"
  `);
    for (const organisation of organisations) {
      if (organisation.migrations?.includes("structures-categories-extract")) continue;
      const structures = await queryInterface.sequelize.query(`SELECT * FROM "mano"."Structure"  WHERE "organisation" = :_id`, {
        replacements: {
          _id: organisation._id,
        },
        type: Sequelize.QueryTypes.SELECT,
      });
      const groupedCategories = [
        {
          groupTitle: "Toutes mes catégories",
          categories: structures
            .reduce((allCategories, structure) => {
              if (structure.categories?.length) {
                for (const category of structure.categories) {
                  if (!allCategories.includes(category)) {
                    allCategories.push(category);
                  }
                }
              }
              return allCategories;
            }, [])
            .sort((a, b) => a.localeCompare(b)),
        },
      ];

      await queryInterface.sequelize.query(
        `UPDATE "mano"."Organisation" SET "structuresGroupedCategories"=:structuresGroupedCategories, "migrations"=:migrations WHERE "_id"=:_id`,
        {
          replacements: {
            structuresGroupedCategories: JSON.stringify(groupedCategories),
            migrations: `{"${[...(organisation.migrations || []), "structures-categories-extract"].join(`","`)}"}`,
            _id: organisation._id,
          },
          type: Sequelize.QueryTypes.UPDATE,
        }
      );
    }
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
