const pg = require("pg");
const bcrypt = require("bcryptjs");
import { v4 as uuidv4 } from "uuid";

const postgresqlUrl = `${process.env.PGBASEURL}/${process.env.PGDATABASE}`;

export async function useSuperAdminAndOrga() {
  const client = new pg.Client(postgresqlUrl);
  await client.connect();

  const orgId = uuidv4();
  const userId = uuidv4();

  const date = "2021-01-01";

  await client.query(
    `delete from mano."Organisation" where name='Default orga'`
  );
  await client.query(
    `INSERT INTO mano."Organisation" (
      _id, 
      name, 
      "createdAt", 
      "updatedAt", 
      categories, 
      "encryptionEnabled"
    ) VALUES (
      $1, 
      'Default orga', 
      $2,
      $2, 
      null, 
      false
    );`,
    [orgId, date]
  );

  await client.query(`delete from mano."User" where name='Super Admin'`);
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
      "termsAccepted"
    ) VALUES (
      $1, 
      'Super Admin', 
      'admin@example.org', 
      $2, 
      $3,
      $4, 
      $4, 
      $4, 
      'superadmin',
      $5::date, 
      null, 
      null, 
      $4
    );`,
    [userId, bcrypt.hashSync("secret", 10), orgId, date, date]
  );
  await client.end();
}
