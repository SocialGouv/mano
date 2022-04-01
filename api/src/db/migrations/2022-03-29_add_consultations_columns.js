const sequelize = require("../sequelize");

const json = JSON.stringify([
  { name: "Psychologique", fields: [{ name: "description", type: "textarea", label: "Description", enabled: true, showInStats: false }] },
  { name: "Infirmier", fields: [{ name: "description", type: "textarea", label: "Description", enabled: true, showInStats: false }] },
  { name: "Médicale", fields: [{ name: "description", type: "textarea", label: "Description", enabled: true, showInStats: false }] },
]);

// No injection here, no need to escape.
sequelize.query(`
  ALTER TABLE "mano"."Organisation"
  ADD COLUMN IF NOT EXISTS "consultations" JSONB DEFAULT '${json}'::JSONB;
`);
