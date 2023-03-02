const sequelize = require("../sequelize");
const Organisation = require("../../models/organisation");
const Structures = require("../../models/structure");
const { capture } = require("../../sentry");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "structuresGroupedCategories" jsonb;
    `);
    const organisations = await Organisation.findAll();
    for (const organisation of organisations) {
      if (organisation.migrations?.includes("structures-categories-init")) continue;
      const structures = await Structures.findAll({ where: { organisation: organisation._id } });
      organisation.set({
        structuresGroupedCategories: [
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
        ],
        migrations: [...(organisation.migrations || []), "structures-categories-init"],
      });
      await organisation.save();
    }
  } catch (e) {
    capture(e);
  }
};
