const sequelize = require("../sequelize");
const { ENCRYPTED_FIELDS_ONLY } = require("../../config");

if (ENCRYPTED_FIELDS_ONLY) {
  sequelize.query(`ALTER TABLE "mano"."Action"
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "description",
  DROP COLUMN IF EXISTS "person",
  DROP COLUMN IF EXISTS "structure",
  DROP COLUMN IF EXISTS "team",
  DROP COLUMN IF EXISTS "user",
  DROP COLUMN IF EXISTS "withTime",
  DROP COLUMN IF EXISTS "category",
  DROP COLUMN IF EXISTS "categories";
  ALTER TABLE "mano"."Comment"
  DROP COLUMN IF EXISTS "type",
  DROP COLUMN IF EXISTS "item",
  DROP COLUMN IF EXISTS "comment",
  DROP COLUMN IF EXISTS "user",
  DROP COLUMN IF EXISTS "team",
  DROP COLUMN IF EXISTS "action",
  DROP COLUMN IF EXISTS "person";
  ALTER TABLE "mano"."Person"
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "gender",
  DROP COLUMN IF EXISTS "birthdate",
  DROP COLUMN IF EXISTS "description",
  DROP COLUMN IF EXISTS "user",
  DROP COLUMN IF EXISTS "healthInsurance",
  DROP COLUMN IF EXISTS "vulnerabilities",
  DROP COLUMN IF EXISTS "consumptions",
  DROP COLUMN IF EXISTS "wanderingAt",
  DROP COLUMN IF EXISTS "personalSituation",
  DROP COLUMN IF EXISTS "nationalitySituation",
  DROP COLUMN IF EXISTS "hasAnimal",
  DROP COLUMN IF EXISTS "address",
  DROP COLUMN IF EXISTS "resources",
  DROP COLUMN IF EXISTS "reason",
  DROP COLUMN IF EXISTS "reasons",
  DROP COLUMN IF EXISTS "otherNames",
  DROP COLUMN IF EXISTS "structureSocial",
  DROP COLUMN IF EXISTS "structureMedical",
  DROP COLUMN IF EXISTS "employment",
  DROP COLUMN IF EXISTS "addressDetail",
  DROP COLUMN IF EXISTS "alertness",
  DROP COLUMN IF EXISTS "startTakingCareAt",
  DROP COLUMN IF EXISTS "phone";
  ALTER TABLE "mano"."Place"
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "user",
  DROP COLUMN IF EXISTS "persons";
  ALTER TABLE "mano"."RelPersonPlace"
  DROP COLUMN IF EXISTS "person",
  DROP COLUMN IF EXISTS "place",
  DROP COLUMN IF EXISTS "user";
  ALTER TABLE "mano"."Report"
  DROP COLUMN IF EXISTS "description",
  DROP COLUMN IF EXISTS "date",
  DROP COLUMN IF EXISTS "team",
  DROP COLUMN IF EXISTS "services",
  DROP COLUMN IF EXISTS "passages";
  ALTER TABLE "mano"."Territory"
  DROP COLUMN IF EXISTS "name",
  DROP COLUMN IF EXISTS "types",
  DROP COLUMN IF EXISTS "perimeter",
  DROP COLUMN IF EXISTS "user";
  ALTER TABLE "mano"."TerritoryObservation"
  DROP COLUMN IF EXISTS "persons",
  DROP COLUMN IF EXISTS "police",
  DROP COLUMN IF EXISTS "material",
  DROP COLUMN IF EXISTS "atmosphere",
  DROP COLUMN IF EXISTS "mediation",
  DROP COLUMN IF EXISTS "comment",
  DROP COLUMN IF EXISTS "territory",
  DROP COLUMN IF EXISTS "team",
  DROP COLUMN IF EXISTS "user",
  DROP COLUMN IF EXISTS "personsMale",
  DROP COLUMN IF EXISTS "personsFemale";
  DROP TABLE IF EXISTS "mano"."RelPersonTeam";
  `);
}
