CREATE SCHEMA IF NOT EXISTS mano;


CREATE TABLE IF NOT EXISTS mano."Action" (
    _id uuid NOT NULL,
    status text,
    "dueAt" timestamp with time zone,
    "completedAt" timestamp with time zone,
    organisation uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    encrypted text,
    "encryptedEntityKey" text,
    "deletedAt" timestamp with time zone
);



CREATE TABLE IF NOT EXISTS mano."Comment" (
    _id uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    organisation uuid,
    encrypted text,
    "encryptedEntityKey" text,
    "deletedAt" timestamp with time zone
);



CREATE TABLE IF NOT EXISTS mano."Consultation" (
    _id uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "dueAt" timestamp with time zone NOT NULL,
    "completedAt" timestamp with time zone,
    "deletedAt" timestamp with time zone,
    status text,
    organisation uuid,
    "onlyVisibleBy" uuid[],
    encrypted text,
    "encryptedEntityKey" text
);



CREATE TABLE IF NOT EXISTS mano."MedicalFile" (
    _id uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    organisation uuid,
    encrypted text,
    "encryptedEntityKey" text
);



CREATE TABLE IF NOT EXISTS mano."Organisation" (
    _id uuid NOT NULL,
    name text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    categories text[],
    "actionsGroupedCategories" jsonb,
    "groupedServices" jsonb,
    consultations jsonb DEFAULT '[{"name": "Médicale", "fields": [{"name": "description", "type": "textarea", "label": "Description", "enabled": true, "showInStats": false}]}]'::jsonb,
    "encryptionEnabled" boolean DEFAULT false,
    "encryptionLastUpdateAt" timestamp with time zone,
    encrypting boolean DEFAULT false,
    "receptionEnabled" boolean DEFAULT false,
    services text[],
    collaborations text[],
    "customFieldsObs" jsonb,
    "fieldsPersonsCustomizableOptions" jsonb,
    "customFieldsPersonsSocial" jsonb default '[{"name":"personalSituation","type":"enum","label":"Situation personnelle","enabled":true,"options":["Aucune","Homme isolé","Femme isolée","En couple","Famille","Famille monoparentale","Mineur","Autre"],"required":false,"showInStats":true},{"name":"nationalitySituation","type":"enum","label":"Nationalité","enabled":true,"options":["Hors UE","UE","Française","Apatride"],"required":false,"showInStats":true},{"name":"hasAnimal","type":"yes-no","label":"Avec animaux","enabled":true,"options":["Oui","Non"],"required":false,"showInStats":true},{"name":"structureSocial","type":"text","label":"Structure de suivi social","enabled":true,"required":false,"showInStats":true},{"name":"employment","type":"enum","label":"Emploi","enabled":true,"options":["DPH","CDD","CDDI","CDI","Interim","Bénévolat","Sans activité","Étudiant","Non déclaré","Autre"],"required":false,"showInStats":true},{"name":"resources","type":"multi-choice","label":"Ressources","enabled":true,"options":["SANS","ARE","RSA","AAH","ADA","ATA","Retraite","Salaire","Allocation Chômage","Indemnités journalières","Mendicité","Aide financière CCAS","Revenus de Formations","Pension d''invalidité","Contrat d''engagement jeune","Contrat jeune majeur","Autre"],"required":false,"showInStats":true},{"name":"address","type":"yes-no","label":"Hébergement","enabled":true,"options":["Oui","Non"],"required":false,"showInStats":true},{"name":"addressDetail","type":"enum","label":"Type d''hébergement","enabled":true,"options":["Logement","Hébergement association","Chez un tiers","Mise à l''abri","Logement accompagné","Urgence","Insertion","Hôtel","Autre"],"required":false,"showInStats":true,"allowCreateOption":true},{"name":"reasons","type":"multi-choice","label":"Motif de la situation en rue","enabled":true,"options":["Sortie d''hébergement","Expulsion de logement/hébergement","Départ du pays d''origine","Départ de région","Rupture familiale","Perte d''emploi","Sortie d''hospitalisation","Problème de santé","Sortie d''ASE","Sortie de détention","Rupture de soins","Autre"],"required":false,"showInStats":true}]',
    "customFieldsPersonsMedical" jsonb default '[{"name":"structureMedical","type":"text","label":"Structure de suivi médical","enabled":true,"required":false,"showInStats":true},{"name":"healthInsurances","type":"multi-choice","label":"Couverture(s) médicale(s)","enabled":true,"options":["Aucune","Régime Général","PUMa","AME","CSS","Autre"],"required":false,"showInStats":true},{"name":"consumptions","label":"Consommations","type":"multi-choice","options":["Alcool","Amphétamine/MDMA/Ecstasy","Benzodiazépines","Buprénorphine/Subutex","Cocaïne","Crack","Cannabis","Héroïne","Lyrica","Méthadone","Moscantin/Skénan","Tabac","Tramadol"],"enabled":true,"required":false,"showInStats":true},{"name":"vulnerabilities","label":"Vulnérabilités","type":"multi-choice","options":["Pathologie chronique","Psychologique","Injecteur","Handicap"],"enabled":true,"required":false,"showInStats":true},{"name":"caseHistoryTypes","label":"Catégorie d''antécédents","type":"multi-choice","options":["Psychiatrie","Neurologie","Dermatologie","Pulmonaire","Gastro-enterologie","Rhumatologie","Cardio-vasculaire","Ophtalmologie","ORL","Dentaire","Traumatologie","Endocrinologie","Uro-gynéco","Cancer","Addiction alcool","Addiction autres","Hospitalisation"],"enabled":true,"required":false,"showInStats":true},{"name":"caseHistoryDescription","label":"Informations complémentaires (antécédents)","type":"textarea","options":null,"enabled":true,"required":false,"showInStats":true}]',
    "encryptedVerificationKey" text,
    migrations text[],
    "migrationLastUpdateAt" timestamp with time zone,
    migrating boolean DEFAULT false,
    "customFieldsMedicalFile" jsonb
);



CREATE TABLE IF NOT EXISTS mano."Passage" (
    _id uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    organisation uuid,
    encrypted text,
    "encryptedEntityKey" text,
    "deletedAt" timestamp with time zone
);



CREATE TABLE IF NOT EXISTS mano."Person" (
    _id uuid NOT NULL,
    organisation uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    encrypted text,
    "encryptedEntityKey" text,
    "deletedAt" timestamp with time zone
);



CREATE TABLE IF NOT EXISTS mano."Place" (
    _id uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    organisation uuid,
    encrypted text,
    "encryptedEntityKey" text,
    "deletedAt" timestamp with time zone
);



CREATE TABLE IF NOT EXISTS mano."RelPersonPlace" (
    _id uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    organisation uuid,
    encrypted text,
    "encryptedEntityKey" text,
    "deletedAt" timestamp with time zone
);



CREATE TABLE IF NOT EXISTS mano."RelUserTeam" (
    _id uuid NOT NULL,
    "user" uuid,
    team uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



CREATE TABLE IF NOT EXISTS mano."Report" (
    _id uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    encrypted text,
    "encryptedEntityKey" text,
    organisation uuid,
    "deletedAt" timestamp with time zone
);



CREATE TABLE IF NOT EXISTS mano."Structure" (
    _id uuid NOT NULL,
    name text,
    description text,
    city text,
    postcode text,
    adresse text,
    phone text,
    organisation uuid,
    categories text[],
    "groupedServices" jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);



CREATE TABLE IF NOT EXISTS mano."Team" (
    _id uuid NOT NULL,
    name text,
    organisation uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "nightSession" boolean DEFAULT false
);



CREATE TABLE IF NOT EXISTS mano."Territory" (
    _id uuid NOT NULL,
    organisation uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    encrypted text,
    "encryptedEntityKey" text,
    "deletedAt" timestamp with time zone
);



CREATE TABLE IF NOT EXISTS mano."TerritoryObservation" (
    _id uuid NOT NULL,
    organisation uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    encrypted text,
    "encryptedEntityKey" text,
    "deletedAt" timestamp with time zone
);



CREATE TABLE IF NOT EXISTS mano."Treatment" (
    _id uuid NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    organisation uuid,
    encrypted text,
    "encryptedEntityKey" text
);



CREATE TABLE IF NOT EXISTS mano."User" (
    _id uuid NOT NULL,
    name text,
    email text NOT NULL,
    password text NOT NULL,
    organisation uuid,
    "lastLoginAt" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    role text,
    "lastChangePasswordAt" date,
    "forgotPasswordResetExpires" date,
    "forgotPasswordResetToken" text,
    "termsAccepted" timestamp with time zone,
    "healthcareProfessional" boolean DEFAULT false,
    "debugApp" jsonb,
    "debugDashboard" jsonb
);




ALTER TABLE ONLY mano."Action"
    ADD CONSTRAINT "Action_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Consultation"
    ADD CONSTRAINT "Consultation_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."MedicalFile"
    ADD CONSTRAINT "MedicalFile_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Organisation"
    ADD CONSTRAINT "Organisation_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Passage"
    ADD CONSTRAINT "Passage_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Person"
    ADD CONSTRAINT "Person_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Place"
    ADD CONSTRAINT "Place_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."RelPersonPlace"
    ADD CONSTRAINT "RelPersonPlace_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."RelUserTeam"
    ADD CONSTRAINT "RelUserTeam_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."RelUserTeam"
    ADD CONSTRAINT "RelUserTeam_user_team_key" UNIQUE ("user", team);



ALTER TABLE ONLY mano."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Structure"
    ADD CONSTRAINT "Structure_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Team"
    ADD CONSTRAINT "Team_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."TerritoryObservation"
    ADD CONSTRAINT "TerritoryObservation_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Territory"
    ADD CONSTRAINT "Territory_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Treatment"
    ADD CONSTRAINT "Treatment_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);



ALTER TABLE ONLY mano."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (_id);



ALTER TABLE ONLY mano."Action"
    ADD CONSTRAINT "Action_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE;



ALTER TABLE ONLY mano."Comment"
    ADD CONSTRAINT "Comment_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."Consultation"
    ADD CONSTRAINT "Consultation_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."MedicalFile"
    ADD CONSTRAINT "MedicalFile_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."Passage"
    ADD CONSTRAINT "Passage_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."Person"
    ADD CONSTRAINT "Person_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE;



ALTER TABLE ONLY mano."Place"
    ADD CONSTRAINT "Place_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."RelPersonPlace"
    ADD CONSTRAINT "RelPersonPlace_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."RelUserTeam"
    ADD CONSTRAINT "RelUserTeam_team_fkey" FOREIGN KEY (team) REFERENCES mano."Team"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."RelUserTeam"
    ADD CONSTRAINT "RelUserTeam_user_fkey" FOREIGN KEY ("user") REFERENCES mano."User"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."Report"
    ADD CONSTRAINT "Report_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."Structure"
    ADD CONSTRAINT "Structure_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE;



ALTER TABLE ONLY mano."Team"
    ADD CONSTRAINT "Team_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE;



ALTER TABLE ONLY mano."TerritoryObservation"
    ADD CONSTRAINT "TerritoryObservation_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."Territory"
    ADD CONSTRAINT "Territory_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."Treatment"
    ADD CONSTRAINT "Treatment_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY mano."User"
    ADD CONSTRAINT "User_organisation_fkey" FOREIGN KEY (organisation) REFERENCES mano."Organisation"(_id) ON UPDATE CASCADE ON DELETE CASCADE DEFERRABLE;


--
-- PostgreSQL database dump complete
--


