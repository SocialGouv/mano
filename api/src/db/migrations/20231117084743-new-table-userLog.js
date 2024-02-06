"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS mano."UserLog" (
        _id uuid NOT NULL,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        organisation uuid,
        "user" uuid,
        platform text,
        action text,
        "debugApp" jsonb,
        "debugDashboard" jsonb,
        PRIMARY KEY (_id),
        CONSTRAINT "UserLog_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE,
        CONSTRAINT "UserLog_user_fkey" FOREIGN KEY ("user") REFERENCES mano."User"(_id) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE
      );
      CREATE INDEX IF NOT EXISTS "UserLog_organisation_idx" ON mano."UserLog" USING btree (organisation);
      CREATE INDEX IF NOT EXISTS "UserLog_user_idx" ON mano."UserLog" USING btree ("user");
  `);
  },

  async down() {
    // Qui fait des down, et pourquoi ?
  },
};
