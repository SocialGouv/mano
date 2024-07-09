import pg from "pg";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

if (!process.env.PGBASEURL || !process.env.PGDATABASE) {
  console.log("PGBASEURL and PGDATABASE env variables not set");
  process.exit(1);
}

async function createUsersAndOrgas() {
  const client = new pg.Client({
    connectionString: `${process.env.PGBASEURL}/manotest`,
  });
  await client.connect();
  await client.query(`delete from mano."Organisation" where name like 'Orga Test - %'`);
  await client.query(`delete from mano."User" where email like '%@example.org'`);
  await client.query(`delete from mano."Team" where name like 'Team Test - %'`);

  const passwordSecret = bcrypt.hashSync("secret", 10);
  const city = "Rouen";
  const date = "2021-01-01";

  for (let i = 1; i < 12; i++) {
    const orgId = uuidv4();
    const adminId = uuidv4();
    const healthProfessionalId = uuidv4();
    const normalUserId = uuidv4();
    const restrictedUserId = uuidv4();
    const statsOnlyUserId = uuidv4();
    const teamId = uuidv4();

    await client.query(
      `INSERT INTO mano."Organisation" (
        _id,
        name,
        "createdAt",
        "updatedAt",
        "encryptionEnabled",
        "encryptionLastUpdateAt",
        "encryptedVerificationKey",
        services,
        "receptionEnabled",
        collaborations,
        "fieldsPersonsCustomizableOptions",
        "actionsGroupedCategories",
        city
      ) VALUES (
        $1,
        $3,
        $2,
        $2,
        true,
        $2,
        'Q5DgJJ7xjdctMfRYKCQYxvaOlDlgMcx6D2GB9cJqEvHuUw+TRKtRVeXFnDj5i8QhhfJAEOTBbx0=',
        '{Café,Douche,Repas,Kit,"Don chaussures","Distribution seringue"}',
        true,
        '{"Ma première collab"}',
        '[{"name": "outOfActiveListReasons", "type": "multi-choice", "label": "Motif(s) de sortie de file active", "enabled": true, "options": ["Relai vers autre structure", "Hébergée", "Décès", "Incarcération", "Départ vers autre région", "Perdu de vue", "Hospitalisation", "Reconduite à la frontière"], "showInStats": true}]',
        '[{"groupTitle": "Toutes mes catégories", "categories": ["impots"]}]',
        $4
      );`,
      [orgId, date, `Orga Test - ${i}`, city]
    );

    await client.query(
      `INSERT INTO mano."User" (
        _id,
        name,
        email,
        password,
        organisation,
        "lastLoginAt",
        "createdAt",
        "updatedAt",
        role,
        "lastChangePasswordAt",
        "forgotPasswordResetExpires",
        "forgotPasswordResetToken",
        "termsAccepted",
        "cgusAccepted",
        "healthcareProfessional"
      ) VALUES (
        $1,
        $6,
        $7,
        $2,
        $3,
        $4,
        $4,
        $4,
        'admin',
        $5::date,
        null,
        null,
        $4,
        $4,
        true
      );`,
      [adminId, passwordSecret, orgId, date, date, `User Admin Test - ${i}`, `admin${i}@example.org`]
    );

    await client.query(
      `INSERT INTO mano."User" (
        _id,
        name,
        email,
        password,
        organisation,
        "lastLoginAt",
        "createdAt",
        "updatedAt",
        role,
        "lastChangePasswordAt",
        "forgotPasswordResetExpires",
        "forgotPasswordResetToken",
        "termsAccepted",
        "cgusAccepted",
        "healthcareProfessional"
      ) VALUES (
        $1,
        $6,
        $7,
        $2,
        $3,
        $4,
        $4,
        $4,
        'normal',
        $5::date,
        null,
        null,
        $4,
        $4,
        true
      );`,
      [healthProfessionalId, passwordSecret, orgId, date, date, `User Health Professional Test - ${i}`, `healthprofessional${i}@example.org`]
    );

    await client.query(
      `INSERT INTO mano."User" (
        _id,
        name,
        email,
        password,
        organisation,
        "lastLoginAt",
        "createdAt",
        "updatedAt",
        role,
        "lastChangePasswordAt",
        "forgotPasswordResetExpires",
        "forgotPasswordResetToken",
        "termsAccepted",
        "cgusAccepted",
        "healthcareProfessional"
      ) VALUES (
        $1,
        $6,
        $7,
        $2,
        $3,
        $4,
        $4,
        $4,
        'normal',
        $5::date,
        null,
        null,
        $4,
        $4,
        false
      );`,
      [normalUserId, passwordSecret, orgId, date, date, `User Normal Test - ${i}`, `normal${i}@example.org`]
    );

    await client.query(
      `INSERT INTO mano."User" (
        _id,
        name,
        email,
        password,
        organisation,
        "lastLoginAt",
        "createdAt",
        "updatedAt",
        role,
        "lastChangePasswordAt",
        "forgotPasswordResetExpires",
        "forgotPasswordResetToken",
        "termsAccepted",
        "cgusAccepted",
        "healthcareProfessional"
      ) VALUES (
        $1,
        $6,
        $7,
        $2,
        $3,
        $4,
        $4,
        $4,
        'restricted-access',
        $5::date,
        null,
        null,
        $4,
        $4,
        false
      );`,
      [restrictedUserId, passwordSecret, orgId, date, date, `User Restricted Test - ${i}`, `restricted${i}@example.org`]
    );

    await client.query(
      `INSERT INTO mano."User" (
        _id,
        name,
        email,
        password,
        organisation,
        "lastLoginAt",
        "createdAt",
        "updatedAt",
        role,
        "lastChangePasswordAt",
        "forgotPasswordResetExpires",
        "forgotPasswordResetToken",
        "termsAccepted",
        "cgusAccepted",
        "healthcareProfessional"
      ) VALUES (
        $1,
        $6,
        $7,
        $2,
        $3,
        $4,
        $4,
        $4,
        'stats-only',
        $5::date,
        null,
        null,
        $4,
        $4,
        false
      );`,
      [statsOnlyUserId, passwordSecret, orgId, date, date, `User Stats Only Test - ${i}`, `stats-only${i}@example.org`]
    );

    await client.query(
      `INSERT INTO mano."Team" (
        _id,
        name,
        organisation,
        "createdAt",
        "updatedAt"
      ) VALUES (
        $1,
        $4,
        $2,
        $3,
        $3
      );`,
      [teamId, orgId, date, `Team Test - ${i}`]
    );

    await client.query(
      `INSERT INTO mano."RelUserTeam" (
        _id,
        "user",
        "team",
        "createdAt",
        "updatedAt",
        "organisation"
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $4,
        $5
      );`,
      [uuidv4(), adminId, teamId, date, orgId]
    );

    await client.query(
      `INSERT INTO mano."RelUserTeam" (
        _id,
        "user",
        "team",
        "createdAt",
        "updatedAt",
        "organisation"
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $4,
        $5
      );`,
      [uuidv4(), healthProfessionalId, teamId, date, orgId]
    );

    await client.query(
      `INSERT INTO mano."RelUserTeam" (
        _id,
        "user",
        "team",
        "createdAt",
        "updatedAt",
        "organisation"
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $4,
        $5
      );`,
      [uuidv4(), normalUserId, teamId, date, orgId]
    );

    await client.query(
      `INSERT INTO mano."RelUserTeam" (
        _id,
        "user",
        "team",
        "createdAt",
        "updatedAt",
        "organisation"
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $4,
        $5
      );`,
      [uuidv4(), restrictedUserId, teamId, date, orgId]
    );

    await client.query(
      `INSERT INTO mano."RelUserTeam" (
        _id,
        "user",
        "team",
        "createdAt",
        "updatedAt",
        "organisation"
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $4,
        $5
      );`,
      [uuidv4(), statsOnlyUserId, teamId, date, orgId]
    );
  }

  // Get first organisation ID
  const res = await client.query(`SELECT _id FROM mano."Organisation" LIMIT 1`);
  const orgId = res.rows[0]._id;

  const superAdminId = uuidv4();
  await client.query(
    `INSERT INTO mano."User" (
      _id,
      name,
      email,
      password,
      organisation,
      "lastLoginAt",
      "createdAt",
      "updatedAt",
      role,
      "lastChangePasswordAt",
      "forgotPasswordResetExpires",
      "forgotPasswordResetToken",
      "termsAccepted",
      "cgusAccepted"
    ) VALUES (
      $1,
      'Super Administrateur',
      'superadmin@example.org',
      $2,
      $5,
      $3,
      $3,
      $3,
      'superadmin',
      $4::date,
      null,
      null,
      $3,
      $3
    );`,
    [superAdminId, passwordSecret, date, date, orgId]
  );

  await client.end();
}

export async function populate() {
  try {
    await createUsersAndOrgas();
  } catch (err) {
    console.error(err);
  }
}

export async function deleteAllPersons() {
  try {
    const client = new pg.Client({
      connectionString: `${process.env.PGBASEURL}/manotest`,
    });
    await client.connect();
    await client.query(`DELETE FROM mano."Person"`);
    await client.end();
  } catch (err) {
    console.error(err);
  }
}
