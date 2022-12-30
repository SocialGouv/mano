const { capture } = require("../../sentry");
const sequelize = require("../sequelize");

module.exports = async () => {
  try {
    await sequelize.query(`
      create table if not exists mano."Service" (
        _id uuid not null primary key,
        service text not null,
        "count" integer not null,
        "date" date not null,
        team uuid,
        organisation uuid,
        "createdAt" timestamp with time zone not null,
        "updatedAt" timestamp with time zone not null,
        "deletedAt" timestamp with time zone,
        unique (organisation, service, "date", team),
        foreign key ("team") references "mano"."Team"("_id") on delete cascade on update cascade,
        foreign key ("organisation") references "mano"."Organisation"("_id") on delete cascade on update cascade
      );
    `);
    // Add index on what we actually query on.
    await sequelize.query(`create index if not exists idx_service_date_team on mano."Service" ("date", team);`);
  } catch (e) {
    capture(e);
  }
};
