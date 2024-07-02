"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      ADD COLUMN IF NOT EXISTS "territoriesGroupedTypes" jsonb
      default '[{"groupTitle": "Tous mes types", "types": ["Lieu de conso", "Lieu de deal", "Carrefour de passage", "Campement", "Lieu de vie", "Prostitution", "Errance", "Mendicité", "Loisir", "Rassemblement communautaire", "Historique"]}]';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE "mano"."Organisation"
      DROP COLUMN IF EXISTS "territoriesGroupedTypes";
    `);
  },
};
