import pg from "pg";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const postgresqlUrl = `${process.env.PGBASEURL}/${process.env.PGDATABASE}`;

export async function connectWith(email: string, password: string) {
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
}

// React router seems broken for reason.
export async function navigateWithReactRouter(path: string = "/search") {
  return await page.$eval("a[href='" + path + "']", (el) =>
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
