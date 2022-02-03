drop table if exists "mano"."Comment";

drop table if exists "mano"."Action";

drop table if exists "mano"."RelPersonPlace";

drop table if exists "mano"."Place";

drop table if exists "mano"."Person";

drop table if exists "mano"."RelUserTeam";

drop table if exists "mano"."Report";

drop table if exists "mano"."Structure";

drop table if exists "mano"."TerritoryObservation";

drop table if exists "mano"."Team";

drop table if exists "mano"."Territory";

drop table if exists "mano"."User";

drop table if exists "mano"."Organisation";

create table if not exists "mano"."Organisation"
(
    _id                        uuid                     not null
        constraint "Organisation_pkey"
            primary key,
    name                       text,
    "createdAt"                timestamp with time zone not null,
    "updatedAt"                timestamp with time zone not null,
    categories                 text[],
    "encryptionEnabled"        boolean default false,
    "encryptionLastUpdateAt"   timestamp with time zone,
    "receptionEnabled"         boolean default false,
    services                   text[],
    collaborations             text[],
    "customFieldsObs"          jsonb,
    "customFieldsPersonsSocial"          jsonb,
    "customFieldsPersonsMedical"          jsonb,
    "encryptedVerificationKey" text
);

create table if not exists "mano"."Structure"
(
    _id          uuid                     not null
        constraint "Structure_pkey"
            primary key,
    name         text,
    description  text,
    city         text,
    postcode     text,
    adresse      text,
    phone        text,
    organisation uuid
        constraint "Structure_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade
            deferrable,
    categories   text[],
    "createdAt"  timestamp with time zone not null,
    "updatedAt"  timestamp with time zone not null
);

create table if not exists "mano"."Team"
(
    _id            uuid                     not null
        constraint "Team_pkey"
            primary key,
    name           text,
    organisation   uuid
        constraint "Team_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade
            deferrable,
    "createdAt"    timestamp with time zone not null,
    "updatedAt"    timestamp with time zone not null,
    "nightSession" boolean default false
);

create table if not exists "mano"."Report"
(
    _id                  uuid                     not null
        constraint "Report_pkey"
            primary key,
    description          text,
    date                 timestamp with time zone,
    team                 uuid
        constraint "Report_team_fkey"
            references "mano"."Team"
            on update cascade on delete cascade,
    "createdAt"          timestamp with time zone not null,
    "updatedAt"          timestamp with time zone not null,
    encrypted            text,
    "encryptedEntityKey" text,
    organisation         uuid
        constraint "Report_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade,
    services             text,
    passages             integer,
    collaborations       text[]
);

create table if not exists "mano"."User"
(
    _id                          uuid                     not null
        constraint "User_pkey"
            primary key,
    name                         text,
    email                        text                     not null
        constraint "User_email_key"
            unique,
    password                     text                     not null,
    organisation                 uuid
        constraint "User_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade
            deferrable,
    "lastLoginAt"                timestamp with time zone,
    "createdAt"                  timestamp with time zone not null,
    "updatedAt"                  timestamp with time zone not null,
    role                         text,
    "lastChangePasswordAt"       date,
    "forgotPasswordResetExpires" date,
    "forgotPasswordResetToken"   text,
    "termsAccepted"              timestamp with time zone
);

create table if not exists "mano"."Person"
(
    _id                     uuid                     not null
        constraint "Person_pkey"
            primary key,
    name                    text,
    gender                  text,
    birthdate               timestamp with time zone,
    description             text,
    organisation            uuid
        constraint "Person_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade
            deferrable,
    "user"                  uuid
        constraint "Person_user_fkey"
            references "mano"."User"
            on update cascade on delete set null
            deferrable,
    "createdAt"             timestamp with time zone not null,
    "updatedAt"             timestamp with time zone not null,
    "healthInsurance"       text,
    vulnerabilities         text[],
    consumptions            text[],
    "wanderingAt"           date,
    "personalSituation"     text,
    "nationalitySituation"  text,
    "hasAnimal"             text,
    address                 text,
    resources               text[],
    reason                  text,
    reasons                 text[],
    "otherNames"            text,
    "structureSocial"       text,
    "structureMedical"      text,
    employment              text,
    "addressDetail"         text    default ''::text,
    alertness               boolean default false,
    "startTakingCareAt"     date,
    encrypted               text,
    "encryptedEntityKey"    text,
    phone                   text,
    "outOfActiveList"       boolean default false,
    "outOfActiveListReason" text    default ''::text
);

create table if not exists "mano"."Action"
(
    _id                  uuid                     not null
        constraint "Action_pkey"
            primary key,
    name                 text,
    description          text,
    status               text,
    "withTime"           boolean default false,
    "dueAt"              timestamp with time zone,
    "completedAt"        timestamp with time zone,
    person               uuid
        constraint "Action_person_fkey"
            references "mano"."Person"
            on update cascade on delete cascade
            deferrable,
    structure            uuid
        constraint "Action_structure_fkey"
            references "mano"."Structure"
            on update cascade on delete set null
            deferrable,
    organisation         uuid
        constraint "Action_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade
            deferrable,
    team                 uuid
        constraint "Action_team_fkey"
            references "mano"."Team"
            on update cascade on delete cascade
            deferrable,
    "user"               uuid
        constraint "Action_user_fkey"
            references "mano"."User"
            on update cascade on delete set null
            deferrable,
    "createdAt"          timestamp with time zone not null,
    "updatedAt"          timestamp with time zone not null,
    category             text,
    encrypted            text,
    "encryptedEntityKey" text,
    categories           text[]
);

create table if not exists "mano"."Comment"
(
    _id                  uuid                     not null
        constraint "Comment_pkey"
            primary key,
    type                 text,
    item                 uuid,
    comment              text,
    "user"               uuid
        constraint "Comment_user_fkey"
            references "mano"."User"
            on update cascade on delete set null
            deferrable,
    "createdAt"          timestamp with time zone not null,
    "updatedAt"          timestamp with time zone not null,
    team                 uuid
        constraint comment_team_fk
            references "mano"."Team"
            on update cascade on delete cascade,
    organisation         uuid
        constraint "Comment_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade,
    action               uuid
        constraint "Comment_action_fkey"
            references "mano"."Action"
            on update cascade on delete cascade,
    person               uuid
        constraint "Comment_person_fkey"
            references "mano"."Person"
            on update cascade on delete cascade,
    encrypted            text,
    "encryptedEntityKey" text
);

create table if not exists "mano"."Place"
(
    _id                  uuid                     not null
        constraint "Place_pkey"
            primary key,
    name                 text,
    "user"               uuid
        constraint "Place_user_fkey"
            references "mano"."User"
            on update cascade on delete cascade
            deferrable,
    "createdAt"          timestamp with time zone not null,
    "updatedAt"          timestamp with time zone not null,
    organisation         uuid
        constraint "Place_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade,
    encrypted            text,
    "encryptedEntityKey" text
);

create table if not exists "mano"."RelPersonPlace"
(
    _id                  uuid                     not null
        constraint "RelPersonPlace_pkey"
            primary key,
    person               uuid
        constraint "RelPersonPlace_person_fkey"
            references "mano"."Person"
            on update cascade on delete cascade,
    place                uuid
        constraint "RelPersonPlace_place_fkey"
            references "mano"."Place"
            on update cascade on delete cascade,
    "createdAt"          timestamp with time zone not null,
    "updatedAt"          timestamp with time zone not null,
    organisation         uuid
        constraint "RelPersonPlace_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade,
    "user"               uuid
        constraint "RelPersonPlace_user_fkey"
            references "mano"."User",
    encrypted            text,
    "encryptedEntityKey" text,
    constraint "RelPersonPlace_person_place_key"
        unique (person, place)
);

create table if not exists "mano"."RelUserTeam"
(
    _id         uuid                     not null
        constraint "RelUserTeam_pkey"
            primary key,
    "user"      uuid
        constraint "RelUserTeam_user_fkey"
            references "mano"."User"
            on update cascade on delete cascade,
    team        uuid
        constraint "RelUserTeam_team_fkey"
            references "mano"."Team"
            on update cascade on delete cascade,
    "createdAt" timestamp with time zone not null,
    "updatedAt" timestamp with time zone not null,
    constraint "RelUserTeam_user_team_key"
        unique ("user", team)
);

create table if not exists "mano"."Territory"
(
    _id                  uuid                     not null
        constraint "Territory_pkey"
            primary key,
    name                 text,
    types                text[],
    perimeter            text,
    organisation         uuid
        constraint "Territory_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade,
    "user"               uuid
        constraint "Territory_user_fkey"
            references "mano"."User"
            on update cascade on delete set null,
    "createdAt"          timestamp with time zone not null,
    "updatedAt"          timestamp with time zone not null,
    encrypted            text,
    "encryptedEntityKey" text
);

create table if not exists "mano"."TerritoryObservation"
(
    _id                  uuid                     not null
        constraint "TerritoryObservation_pkey"
            primary key,
    persons              text,
    police               text,
    material             integer,
    atmosphere           text,
    mediation            text,
    comment              text,
    territory            uuid
        constraint "TerritoryObservation_territory_fkey"
            references "mano"."Territory"
            on update cascade on delete cascade,
    organisation         uuid
        constraint "TerritoryObservation_organisation_fkey"
            references "mano"."Organisation"
            on update cascade on delete cascade,
    team                 uuid
        constraint "TerritoryObservation_team_fkey"
            references "mano"."Team"
            on update cascade on delete cascade,
    "user"               uuid
        constraint "TerritoryObservation_user_fkey"
            references "mano"."User"
            on update cascade on delete set null,
    "createdAt"          timestamp with time zone not null,
    "updatedAt"          timestamp with time zone not null,
    "personsMale"        text,
    "personsFemale"      text,
    encrypted            text,
    "encryptedEntityKey" text
);
