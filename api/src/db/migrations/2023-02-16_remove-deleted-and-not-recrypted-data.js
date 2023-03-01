const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    // This migration has been done when there was a problem in encryption.
    // These problems have been fixed, so this migration is not needed anymore.
    // If there is a new issue, it should be fixed in the code, not in the migration.
    /*
    await sequelize.query(`
      delete from "mano"."Person" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."Consultation" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."Treatment" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."MedicalFile" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."Group" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."Action" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."Passage" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."Rencontre" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."Territory" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."TerritoryObservation" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);

    await sequelize.query(`
      delete from "mano"."Place" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."RelPersonPlace" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
    await sequelize.query(`
      delete from "mano"."Report" r where exists(
      select * from "mano"."Organisation" o
      where r.organisation = o._id 
      and  r."updatedAt" < (o."encryptionLastUpdateAt" - interval '1 hour') and "deletedAt" is not null);`);
      */
  } catch (e) {
    capture(e);
  }
};
