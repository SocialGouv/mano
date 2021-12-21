import pg from "pg";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const postgresqlUrl = `${process.env.PGBASEURL}/${process.env.PGDATABASE}`;

export async function connectWith(
  email: string,
  password: string,
  orgEncryptionKey: string = ""
) {
  await page.goto("http://localhost:8090/auth");
  // Ensure not already connected
  try {
    await page.waitForSelector("#email", { timeout: 1500 });
  } catch (e) {
    await expect(page).toClick("button[type=button]", {
      text: "Me connecter avec un autre utilisateur",
    });
    await expect(page).toMatch("Bienvenue !");
  }
  // Connect
  await expect(page).toFill("#email", email);
  await expect(page).toFill("#password", password);
  await expect(page).toClick("button[type=submit]", { text: "Se connecter" });
  if (!!orgEncryptionKey) {
    await expect(page).toMatch("Clé de chiffrement d'organisation");
    await expect(page).toFill("#orgEncryptionKey", orgEncryptionKey);
    await expect(page).toClick("button[type=submit]", { text: "Se connecter" });
  }
}

// React router seems broken for reason.
export async function navigateWithReactRouter(path: string = "/search") {
  return page.$eval("a[href='" + path + "']", (el) =>
    (el as HTMLElement).click()
  );
}

export async function deleteUser(email: string) {
  const client = new pg.Client(postgresqlUrl);
  await client.connect();
  await client.query(`DELETE FROM mano."User" WHERE email = $1`, [email]);
  await client.end();
}

export async function deleteOrganisation(orgaName: string) {
  const client = new pg.Client(postgresqlUrl);
  await client.connect();
  await client.query(`DELETE FROM mano."Organisation" WHERE name = $1`, [
    orgaName,
  ]);
  await client.end();
}

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
      'superadmin@example.org',
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
      "encryptedVerificationKey"
    ) VALUES (
      $1,
      'Encrypted orga',
      $2,
      $2,
      null,
      true,
      $2,
      'Q5DgJJ7xjdctMfRYKCQYxvaOlDlgMcx6D2GB9cJqEvHuUw+TRKtRVeXFnDj5i8QhhfJAEOTBbx0='
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
      "termsAccepted"
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
      $4
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

export async function scrollDown() {
  return page.evaluate(async (_) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        document?.querySelector(".main > div")?.scrollBy(0, 3000000);
        resolve("ok");
      }, 500);
    });
  });
}

export async function scrollTop() {
  return page.evaluate(async (_) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        document?.querySelector(".main > div")?.scrollBy(0, -3000000);
        resolve("ok");
      }, 500);
    });
  });
}
