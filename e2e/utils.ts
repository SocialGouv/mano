import pg from "pg";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const postgresqlUrl = `${process.env.PGBASEURL}/${process.env.PGDATABASE}`;

export async function useEncryptedOrga() {
  const client = new pg.Client(postgresqlUrl);
  await client.connect();

  const orgId = uuidv4();
  const userId = uuidv4();
  const teamId = uuidv4();
  const relUserTeamId = uuidv4();

  const date = "2021-01-01";

  await client.query(
    `delete from mano."Organisation" where name='Encrypted orga'`
  );
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
      collaborations
    ) VALUES (
      $1,
      'Encrypted orga',
      $2,
      $2,
      null,
      true,
      $2,
      'Q5DgJJ7xjdctMfRYKCQYxvaOlDlgMcx6D2GB9cJqEvHuUw+TRKtRVeXFnDj5i8QhhfJAEOTBbx0=',
      '{Café,Douche,Repas,Kit,"Don chaussures","Distribution seringue"}',
      true,
      '{"Ma première collab"}'
    );`,
    [orgId, date]
  );

  await client.query(
    `delete from mano."User" where name='Encrypted Orga Admin'`
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
      'Encrypted Orga Admin',
      'adminencrypted@example.org',
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
    [userId, bcrypt.hashSync("secret", 10), orgId, date, date]
  );

  await client.query(
    `delete from mano."Team" where name='Encrypted Orga Team'`
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
      'Encrypted Orga Team',
      $2,
      $3,
      $3
    );`,
    [teamId, orgId, date]
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
    [relUserTeamId, userId, teamId, date]
  );

  await client.end();
}
