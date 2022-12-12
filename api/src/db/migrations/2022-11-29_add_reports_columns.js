const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    // Check if constraint Report_team_fkey exists.
    const [results] = await sequelize.query(`SELECT EXISTS (SELECT 1 FROM   pg_constraint WHERE  conname = 'Report_team_fkey');`);
    if (!results[0].exists) {
      await sequelize.query(`
        ALTER TABLE "mano"."Report"
        ADD COLUMN IF NOT EXISTS "team" uuid,
        ADD COLUMN IF NOT EXISTS "date" text,
        ADD CONSTRAINT "Report_team_fkey" FOREIGN KEY ("team") REFERENCES "mano"."Team"("_id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    }
  } catch (e) {
    capture(e);
  }
};
