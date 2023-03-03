const sequelize = require("../sequelize");
const { capture } = require("../../sentry");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "structuresGroupedCategories" jsonb;
    `);
    const [organisations, _] = await sequelize.query(`
      SELECT * FROM "mano"."Organisation"
    `);
    for (const organisation of organisations) {
      if (organisation.migrations?.includes("structures-categories-init")) continue;
      const structures = await sequelize.query(`SELECT * FROM "mano"."Structure"  WHERE "organisation" = :_id`, {
        replacements: {
          _id: organisation._id,
        },
        type: sequelize.QueryTypes.SELECT,
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
      await sequelize.query(
        `UPDATE "mano"."Organisation" SET "structuresGroupedCategories"=:structuresGroupedCategories, "migrations"=:migrations WHERE "_id"=:_id`,
        {
          replacements: {
            structuresGroupedCategories: groupedCategories,
            migrations: [...(organisation.migrations || []), "structures-categories-init"],
            _id: organisation._id,
          },
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    }
  } catch (e) {
    capture(e);
  }
};
