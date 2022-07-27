const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    /*

    TEAM relation

    */
    for (const table of ["Action", "Passage", "Comment", "TerritoryObservation"]) {
      await sequelize.query(`
      alter table "mano"."${table}"
        add column if not exists "team" uuid
            constraint "${table}_team_fkey" references mano."Team" on update cascade on delete set NULL;
        `);
    }

    for (const table of ["Report"]) {
      await sequelize.query(`
      alter table "mano"."${table}"
        add column if not exists "team" uuid
            constraint "${table}_team_fkey" references mano."Team" on update cascade on delete cascade;
        `);
    }

    /*

    USER relation

    */
    for (const table of [
      "Action",
      "Passage",
      "Comment",
      "Consultation",
      "Treatment",
      "RelPersonPlace",
      "Person",
      "Place",
      "Territory",
      "TerritoryObservation",
    ]) {
      await sequelize.query(`
      alter table "mano"."${table}"
        add column if not exists "user" uuid
            constraint "${table}_user_fkey" references mano."User" on update cascade on delete set NULL;
        `);
    }

    /*

    PERSON relation

    */
    for (const table of ["MedicalFile", "Action", "Passage", "Comment", "Consultation", "Treatment", "RelPersonPlace"]) {
      await sequelize.query(`
      alter table "mano"."${table}"
        add column if not exists "person" uuid
            constraint "${table}_person_fkey" references mano."Person" on update cascade on delete cascade;
        `);
    }
    /*

    PLACE relation

    */
    await sequelize.query(`
    alter table "mano"."RelPersonPlace"
      add column if not exists "place" uuid
          constraint "RelPersonPlace_place_fkey" references mano."Place" on update cascade on delete cascade;
      `);

    /*

    ACTION relation

    */
    await sequelize.query(`
    alter table "mano"."Comment"
      add column if not exists "action" uuid
          constraint "Comment_action_fkey" references mano."Action" on update cascade on delete cascade;
      `);

    /*

    TERRITORY relation

    */
    await sequelize.query(`
    alter table "mano"."TerritoryObservation"
      add column if not exists "territory" uuid
          constraint "TerritoryObservation_territory_fkey" references mano."Territory" on update cascade on delete cascade;
      `);
  } catch (e) {
    capture(e);
  }
};
