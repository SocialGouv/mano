const sequelize = require("../sequelize");
const { ENCRYPTED_FIELDS_ONLY } = require("../../config");

if (ENCRYPTED_FIELDS_ONLY) {
  sequelize.query(`
    ALTER TABLE "mano"."Person"
    DROP COLUMN IF EXISTS "outOfActiveList",
    DROP COLUMN IF EXISTS "outOfActiveListReason"
  `);
} else {
  sequelize.query(`
    ALTER TABLE "mano"."Person"
    ADD COLUMN IF NOT EXISTS "outOfActiveList" boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS "outOfActiveListReason" text;
  `);
}
