"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE mano."RelUserTeam"
      ADD COLUMN IF NOT EXISTS organisation uuid REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE;
    `);
    await queryInterface.sequelize.query(`
      UPDATE mano."RelUserTeam" AS rel
      SET organisation = team.organisation
      FROM mano."Team" AS team
      WHERE rel.team = team._id;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE mano."RelUserTeam"
      DROP COLUMN IF EXISTS organisation;
    `);
  },
};
