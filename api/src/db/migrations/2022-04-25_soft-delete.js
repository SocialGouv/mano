const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      ALTER TABLE "mano"."Action"
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone
    `);
    await sequelize.query(`
      ALTER TABLE "mano"."Person"
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone
    `);
    await sequelize.query(`
      ALTER TABLE "mano"."Comment"
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone
    `);
    await sequelize.query(`
      ALTER TABLE "mano"."Place"
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone
    `);
    await sequelize.query(`
      ALTER TABLE "mano"."Passage"
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone
    `);
    await sequelize.query(`
      ALTER TABLE "mano"."RelPersonPlace"
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone
    `);
    await sequelize.query(`
      ALTER TABLE "mano"."Report"
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone
    `);
    await sequelize.query(`
      ALTER TABLE "mano"."Territory"
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone
    `);
    await sequelize.query(`
      ALTER TABLE "mano"."TerritoryObservation"
      ADD COLUMN IF NOT EXISTS "deletedAt" timestamp with time zone
    `);
  } catch (e) {
    capture(e);
  }
};
