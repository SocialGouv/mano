const sequelize = require("../sequelize");
const { ENCRYPTED_FIELDS_ONLY } = require("../../config");

sequelize.query(`
    ALTER TABLE "mano"."Person"
    DROP COLUMN IF EXISTS "outOfActiveList",
    DROP COLUMN IF EXISTS "outOfActiveListReason"
  `);
