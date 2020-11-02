
-- ----------------------------
-- To use gen_random_uuid()
-- ----------------------------
CREATE EXTENSION pgcrypto;
-- ----------------------------
-- Schema for mano
-- ----------------------------
CREATE SCHEMA IF NOT EXISTS "mano";
-- ----------------------------
-- Table structure for action
-- ----------------------------
DROP TABLE IF EXISTS "mano"."action";
CREATE TABLE "mano"."action" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text COLLATE "pg_catalog"."default",
  "status" text DEFAULT "A FAIRE",
  "due_at" timestamptz(6),
  "with_time" bool DEFAULT false,
  "completed_at" timestamptz(6),
  "created_at" timestamptz(6) DEFAULT now(),
  "person_id" uuid,
  "structure_id" uuid,
  "organisation_id" uuid,
  "team_id" uuid,
  "user_id" uuid,
  "description" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for comment
-- ----------------------------
DROP TABLE IF EXISTS "mano"."comment";
CREATE TABLE "mano"."comment" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "type" text COLLATE "pg_catalog"."default",
  "item_id" uuid,
  "user_id" uuid,
  "created_at" timestamptz(6) DEFAULT now(),
  "comment" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for organisation
-- ----------------------------
DROP TABLE IF EXISTS "mano"."organisation";
CREATE TABLE "mano"."organisation" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now()
)
;

-- ----------------------------
-- Table structure for person
-- ----------------------------
DROP TABLE IF EXISTS "mano"."person";
CREATE TABLE "mano"."person" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "gender" text COLLATE "pg_catalog"."default",
  "birthdate" date,
  "description" text COLLATE "pg_catalog"."default",
  "organisation_id" uuid,
  "user_id" uuid,
  "created_at" timestamptz(6) DEFAULT now()
)
;

-- ----------------------------
-- Table structure for place
-- ----------------------------
DROP TABLE IF EXISTS "mano"."place";
CREATE TABLE "mano"."place" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "person_id" uuid,
  "user_id" uuid,
  "created_at" timestamptz(6)
)
;

-- ----------------------------
-- Table structure for structure
-- ----------------------------
DROP TABLE IF EXISTS "mano"."structure";
CREATE TABLE "mano"."structure" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "description" text COLLATE "pg_catalog"."default",
  "city" text COLLATE "pg_catalog"."default",
  "postcode" text COLLATE "pg_catalog"."default",
  "phone" text COLLATE "pg_catalog"."default",
  "organisation_id" uuid,
  "created_at" timestamptz(6) DEFAULT now(),
  "categories" text[] COLLATE "pg_catalog"."default",
  "adresse" text COLLATE "pg_catalog"."default"
)
;

-- ----------------------------
-- Table structure for team
-- ----------------------------
DROP TABLE IF EXISTS "mano"."team";
CREATE TABLE "mano"."team" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text COLLATE "pg_catalog"."default" NOT NULL,
  "organisation_id" uuid,
  "created_at" timestamptz(6) DEFAULT now()
)
;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS "mano"."user";
CREATE TABLE "mano"."user" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text COLLATE "pg_catalog"."default",
  "role" text COLLATE "pg_catalog"."default",
  "email" text COLLATE "pg_catalog"."default" NOT NULL,
  "password" text COLLATE "pg_catalog"."default",
  "organisation_id" uuid,
  "team_id" uuid,
  "created_at" timestamptz(6) DEFAULT now(),
  "last_login_at" timestamptz(6)
)
;

-- ----------------------------
-- Function structure for text_array_to_tsvector
-- ----------------------------
CREATE AGGREGATE tsvector_agg (tsvector) (
    SFUNC = tsvector_concat,
    STYPE = tsvector
);
DROP FUNCTION IF EXISTS "mano"."text_array_to_tsvector"("mytext" _text, OUT "tsv" tsvector);
CREATE OR REPLACE FUNCTION "mano"."text_array_to_tsvector"(IN "mytext" _text, OUT "tsv" tsvector)
  RETURNS "pg_catalog"."tsvector" AS $BODY$
  BEGIN
    SELECT INTO tsv
      tsvector_agg(to_tsvector(t))
    FROM unnest(mytext) AS t;
    RETURN;
  END;
$BODY$
  LANGUAGE plpgsql IMMUTABLE
  COST 100;

-- ----------------------------
-- Indexes structure for table action
-- ----------------------------
CREATE INDEX "action_due_at_idx" ON "mano"."action" USING btree (
  "due_at" "pg_catalog"."timestamptz_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "action_id_idx" ON "mano"."action" USING btree (
  "id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);
CREATE INDEX "action_name_idx" ON "mano"."action" USING btree (
  "name" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table action
-- ----------------------------
ALTER TABLE "mano"."action" ADD CONSTRAINT "action_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table comment
-- ----------------------------
CREATE UNIQUE INDEX "comment_id_idx" ON "mano"."comment" USING btree (
  "id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table comment
-- ----------------------------
ALTER TABLE "mano"."comment" ADD CONSTRAINT "comment_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table organisation
-- ----------------------------
CREATE UNIQUE INDEX "organisation_id_idx" ON "mano"."organisation" USING btree (
  "id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table organisation
-- ----------------------------
ALTER TABLE "mano"."organisation" ADD CONSTRAINT "organisation_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table person
-- ----------------------------
CREATE UNIQUE INDEX "person_id_idx" ON "mano"."person" USING btree (
  "id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table person
-- ----------------------------
ALTER TABLE "mano"."person" ADD CONSTRAINT "person_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table place
-- ----------------------------
CREATE UNIQUE INDEX "place_id_idx" ON "mano"."place" USING btree (
  "id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table place
-- ----------------------------
ALTER TABLE "mano"."place" ADD CONSTRAINT "place_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table structure
-- ----------------------------
CREATE UNIQUE INDEX "structure_id_idx" ON "mano"."structure" USING btree (
  "id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table structure
-- ----------------------------
ALTER TABLE "mano"."structure" ADD CONSTRAINT "structure_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table team
-- ----------------------------
CREATE UNIQUE INDEX "team_id_idx" ON "mano"."team" USING btree (
  "id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table team
-- ----------------------------
ALTER TABLE "mano"."team" ADD CONSTRAINT "team_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Indexes structure for table user
-- ----------------------------
CREATE UNIQUE INDEX "user_email_idx" ON "mano"."user" USING btree (
  "email" COLLATE "pg_catalog"."default" "pg_catalog"."text_ops" ASC NULLS LAST
);
CREATE UNIQUE INDEX "user_id_idx" ON "mano"."user" USING btree (
  "id" "pg_catalog"."uuid_ops" ASC NULLS LAST
);

-- ----------------------------
-- Primary Key structure for table user
-- ----------------------------
ALTER TABLE "mano"."user" ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");

-- ----------------------------
-- Foreign Keys structure for table action
-- ----------------------------
ALTER TABLE "mano"."action" ADD CONSTRAINT "action_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "mano"."organisation" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "mano"."action" ADD CONSTRAINT "action_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "mano"."person" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "mano"."action" ADD CONSTRAINT "action_structure_id_fkey" FOREIGN KEY ("structure_id") REFERENCES "mano"."structure" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "mano"."action" ADD CONSTRAINT "action_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "mano"."team" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "mano"."action" ADD CONSTRAINT "action_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "mano"."user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table comment
-- ----------------------------
ALTER TABLE "mano"."comment" ADD CONSTRAINT "comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "mano"."user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table person
-- ----------------------------
ALTER TABLE "mano"."person" ADD CONSTRAINT "person_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "mano"."organisation" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "mano"."person" ADD CONSTRAINT "person_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "mano"."user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table place
-- ----------------------------
ALTER TABLE "mano"."place" ADD CONSTRAINT "place_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "mano"."person" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "mano"."place" ADD CONSTRAINT "place_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "mano"."user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table structure
-- ----------------------------
ALTER TABLE "mano"."structure" ADD CONSTRAINT "structure_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "mano"."organisation" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table team
-- ----------------------------
ALTER TABLE "mano"."team" ADD CONSTRAINT "team_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "mano"."organisation" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- ----------------------------
-- Foreign Keys structure for table user
-- ----------------------------
ALTER TABLE "mano"."user" ADD CONSTRAINT "user_organisation_id_fkey" FOREIGN KEY ("organisation_id") REFERENCES "mano"."organisation" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "mano"."user" ADD CONSTRAINT "user_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "mano"."team" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
