const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    // No injection here, no need to escape.
    await sequelize.query(`
      ALTER TABLE "mano"."Report"
      ADD COLUMN IF NOT EXISTS "team" uuid,
      ADD COLUMN IF NOT EXISTS "date" text,
      ADD CONSTRAINT "Report_team_fkey" FOREIGN KEY ("team") REFERENCES "mano"."Team"("_id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
  } catch (e) {
    capture(e);
  }
};
