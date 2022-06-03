const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

const json = JSON.stringify([
  { name: "Psychologique", fields: [{ name: "description", type: "textarea", label: "Description", enabled: true, showInStats: false }] },
  { name: "Infirmier", fields: [{ name: "description", type: "textarea", label: "Description", enabled: true, showInStats: false }] },
  { name: "Médicale", fields: [{ name: "description", type: "textarea", label: "Description", enabled: true, showInStats: false }] },
]);

module.exports = async () => {
  try {
    // No injection here, no need to escape.
    await sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "consultations" JSONB DEFAULT '${json}'::JSONB;
    `);
  } catch (e) {
    capture(e);
  }
};
