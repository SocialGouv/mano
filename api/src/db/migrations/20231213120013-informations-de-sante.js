"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE mano."Organisation"
      SET "customFieldsPersons" = (
        SELECT jsonb_agg(
          CASE
            WHEN (value ->> 'name') = 'Informations médicales' THEN jsonb_set(value, '{name}', '"Informations de santé"')
            ELSE value
          END
        )
        FROM jsonb_array_elements("customFieldsPersons")
      )
      WHERE "customFieldsPersons" @> '[{"name": "Informations médicales"}]';
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE mano."Organisation"
      SET "customFieldsPersons" = (
        SELECT jsonb_agg(
          CASE
            WHEN (value ->> 'name') = 'Informations de santé' THEN jsonb_set(value, '{name}', '"Informations médicales"')
            ELSE value
          END
        )
        FROM jsonb_array_elements("customFieldsPersons")
      )
      WHERE "customFieldsPersons" @> '[{"name": "Informations de santé"}]';
    `);
  },
};
