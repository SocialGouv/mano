"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      create table if not exists mano."Deployment" (
        _id uuid not null default gen_random_uuid() primary key,
        commit text not null,
        "createdAt" timestamp with time zone not null default now(),
        "updatedAt" timestamp with time zone not null default now()
      );`);
    await queryInterface.sequelize.query(`create index if not exists "Deployment_createdAt_idx" on mano."Deployment" using btree ("createdAt");`);
  },

  async down() {},
};
