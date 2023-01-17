const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`create index if not exists action_deletedat_idx on mano."Action" ("deletedAt");`);
    await sequelize.query(`create index if not exists action_updatedat_idx on mano."Action" ("updatedAt");`);
    await sequelize.query(`create index if not exists action_organisation_idx on mano."Action" (organisation);`);

    await sequelize.query(`create index if not exists comment_deletedat_idx on mano."Comment" ("deletedAt");`);
    await sequelize.query(`create index if not exists comment_updatedat_idx on mano."Comment" ("updatedAt");`);
    await sequelize.query(`create index if not exists comment_organisation_idx on mano."Comment" (organisation);`);

    await sequelize.query(`create index if not exists consulation_deletedat_idx on mano."Consultation" ("deletedAt");`);
    await sequelize.query(`create index if not exists consulation_updatedat_idx on mano."Consultation" ("updatedAt");`);
    await sequelize.query(`create index if not exists consulation_organisation_idx on mano."Consultation" (organisation);`);

    await sequelize.query(`create index if not exists group_deletedat_idx on mano."Group" ("deletedAt");`);
    await sequelize.query(`create index if not exists group_updatedat_idx on mano."Group" ("updatedAt");`);
    await sequelize.query(`create index if not exists group_organisation_idx on mano."Group" (organisation);`);

    await sequelize.query(`create index if not exists medicalfile_deletedat_idx on mano."MedicalFile" ("deletedAt");`);
    await sequelize.query(`create index if not exists medicalfile_updatedat_idx on mano."MedicalFile" ("updatedAt");`);
    await sequelize.query(`create index if not exists medicalfile_organisation_idx on mano."MedicalFile" (organisation);`);

    await sequelize.query(`create index if not exists passage_deletedat_idx on mano."Passage" ("deletedAt");`);
    await sequelize.query(`create index if not exists passage_updatedat_idx on mano."Passage" ("updatedAt");`);
    await sequelize.query(`create index if not exists passage_organisation_idx on mano."Passage" (organisation);`);

    await sequelize.query(`create index if not exists person_deletedat_idx on mano."Person" ("deletedAt");`);
    await sequelize.query(`create index if not exists person_updatedat_idx on mano."Person" ("updatedAt");`);
    await sequelize.query(`create index if not exists person_organisation_idx on mano."Person" (organisation);`);

    await sequelize.query(`create index if not exists place_deletedat_idx on mano."Place" ("deletedAt");`);
    await sequelize.query(`create index if not exists place_updatedat_idx on mano."Place" ("updatedAt");`);
    await sequelize.query(`create index if not exists place_organisation_idx on mano."Place" (organisation);`);

    await sequelize.query(`create index if not exists relpersonplace_deletedat_idx on mano."RelPersonPlace" ("deletedAt");`);
    await sequelize.query(`create index if not exists relpersonplace_updatedat_idx on mano."RelPersonPlace" ("updatedAt");`);
    await sequelize.query(`create index if not exists relpersonplace_organisation_idx on mano."RelPersonPlace" (organisation);`);

    await sequelize.query(`create index if not exists rencontre_deletedat_idx on mano."Rencontre" ("deletedAt");`);
    await sequelize.query(`create index if not exists rencontre_updatedat_idx on mano."Rencontre" ("updatedAt");`);
    await sequelize.query(`create index if not exists rencontre_organisation_idx on mano."Rencontre" (organisation);`);

    await sequelize.query(`create index if not exists report_deletedat_idx on mano."Report" ("deletedAt");`);
    await sequelize.query(`create index if not exists report_updatedat_idx on mano."Report" ("updatedAt");`);
    await sequelize.query(`create index if not exists report_organisation_idx on mano."Report" (organisation);`);

    await sequelize.query(`create index if not exists service_deletedat_idx on mano."Service" ("deletedAt");`);
    await sequelize.query(`create index if not exists service_updatedat_idx on mano."Service" ("updatedAt");`);
    await sequelize.query(`create index if not exists service_organisation_idx on mano."Service" (organisation);`);

    // No deletedAt column for Structure
    await sequelize.query(`create index if not exists structure_updatedat_idx on mano."Structure" ("updatedAt");`);
    await sequelize.query(`create index if not exists structure_organisation_idx on mano."Structure" (organisation);`);

    await sequelize.query(`create index if not exists territory_deletedat_idx on mano."Territory" ("deletedAt");`);
    await sequelize.query(`create index if not exists territory_updatedat_idx on mano."Territory" ("updatedAt");`);
    await sequelize.query(`create index if not exists territory_organisation_idx on mano."Territory" (organisation);`);

    await sequelize.query(`create index if not exists territoryobservation_deletedat_idx on mano."TerritoryObservation" ("deletedAt");`);
    await sequelize.query(`create index if not exists territoryobservation_updatedat_idx on mano."TerritoryObservation" ("updatedAt");`);
    await sequelize.query(`create index if not exists territoryobservation_organisation_idx on mano."TerritoryObservation" (organisation);`);

    await sequelize.query(`create index if not exists treatment_deletedat_idx on mano."Treatment" ("deletedAt");`);
    await sequelize.query(`create index if not exists treatment_updatedat_idx on mano."Treatment" ("updatedAt");`);
    await sequelize.query(`create index if not exists treatment_organisation_idx on mano."Treatment" (organisation);`);

    // No deletedAt column for User
    await sequelize.query(`create index if not exists user_updatedat_idx on mano."User" ("updatedAt");`);
    await sequelize.query(`create index if not exists user_organisation_idx on mano."User" (organisation);`);
  } catch (e) {
    capture(e);
  }
};
