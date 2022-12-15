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
  await client.query(`delete from mano."User" where name like 'User Test - %'`);
  await client.query(`delete from mano."User" where name like 'User Admin Test - %'`);
  await client.query(`delete from mano."User" where name like 'User Health Professional Test - %'`);
  await client.query(`delete from mano."User" where name like 'User Normal Test - %'`);
  await client.query(`delete from mano."User" where name like 'User Restricted Test - %'`);
  await client.query(`delete from mano."Team" where name like 'Team Test - %'`);

  for (let i = 1; i < 12; i++) {
    const orgId = uuidv4();
    const adminId = uuidv4();
    const healthProfessionalId = uuidv4();
    const normalUserId = uuidv4();
    const restrictedUserId = uuidv4();
    const teamId = uuidv4();
    const passwordSecret = bcrypt.hashSync("secret", 10);

    const date = "2021-01-01";

    await client.query(
      `INSERT INTO mano."Organisation" (
        _id,
        name,
        "createdAt",
        "updatedAt",
        categories,
        "encryptionEnabled",
        "encryptionLastUpdateAt",
        "encryptedVerificationKey",
        services,
        "receptionEnabled",
        collaborations,
        "fieldsPersonsCustomizableOptions"
      ) VALUES (
        $1,
        $3,
        $2,
        $2,
        null,
        true,
        $2,
        'Q5DgJJ7xjdctMfRYKCQYxvaOlDlgMcx6D2GB9cJqEvHuUw+TRKtRVeXFnDj5i8QhhfJAEOTBbx0=',
        '{Café,Douche,Repas,Kit,"Don chaussures","Distribution seringue"}',
        true,
        '{"Ma première collab"}',
        '[{"name": "outOfActiveListmotif-de-la-situation-en-rue", "type": "multi-choice", "label": "Motif(s) de sortie de file active", "enabled": true, "options": ["Relai vers autre structure", "Hébergée", "Décès", "Incarcération", "Départ vers autre région", "Perdu de vue", "Hospitalisation", "Reconduite à la frontière"], "showInStats": true}]'
      );`,
      [orgId, date, `Orga Test - ${i}`]
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
        false
      );`,
      [restrictedUserId, passwordSecret, orgId, date, date, `User Restricted Test - ${i}`, `restricted${i}@example.org`]
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
        "updatedAt"
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $4
      );`,
      [uuidv4(), adminId, teamId, date]
    );

    await client.query(
      `INSERT INTO mano."RelUserTeam" (
        _id,
        "user",
        "team",
        "createdAt",
        "updatedAt"
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $4
      );`,
      [uuidv4(), healthProfessionalId, teamId, date]
    );

    await client.query(
      `INSERT INTO mano."RelUserTeam" (
        _id,
        "user",
        "team",
        "createdAt",
        "updatedAt"
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $4
      );`,
      [uuidv4(), normalUserId, teamId, date]
    );

    await client.query(
      `INSERT INTO mano."RelUserTeam" (
        _id,
        "user",
        "team",
        "createdAt",
        "updatedAt"
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $4
      );`,
      [uuidv4(), restrictedUserId, teamId, date]
    );
  }
  await client.end();
}

export async function populate() {
  try {
    await createUsersAndOrgas();
  } catch (err) {
    console.error(err);
  }
}
