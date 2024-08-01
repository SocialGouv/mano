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
    const adminId = i === 11 ? "33400b35-7b77-406b-bb4d-da9bc2dc1832" : uuidv4();
    const healthProfessionalId = uuidv4();
    const normalUserId = uuidv4();
    const restrictedUserId = uuidv4();
    const statsOnlyUserId = uuidv4();
    const teamId = i === 11 ? "33400b35-7b77-406b-bb4d-da9bc2dc1831" : uuidv4();

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
    if (i === 11) {
      await client.query(
        `INSERT INTO mano."Person" (
          _id,
          "createdAt",
          "updatedAt",
          "organisation",
          "encrypted",
          "encryptedEntityKey"
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6
        );`,
        [
          "88eadc54-0f10-49ab-8da7-7b4290fe2866",
          "2020-06-01",
          "2021-07-01",
          orgId,
          "GjzLbXN8Xu1IgA3vGAZUcz2kGrVCjFUowewc5r4f7BuypsfbdYDsGiYr6QdBMMJkO/Cd87qWUWkjd+cXUYx8FjDSg/lOPopHayTSz6F1nZowk9WCwQcRs6AnzW62lKyS+A8/kjl5tgvGoaEVjG+XQENcNun2zsWnjZYf6uHnZteukOefDhCMlrKWrXSNqZ24E/ipLgmUjcrJzJfvitQyqVdg6d4fONyNqqsowaQ//6T+nIoX3G0SW43Hyy25qtR80ZdhuHSvDdfjD/YMtaJ7w8bRNgUyeurwGxQWOpwNrsIkgFK7b8nj+EmRIcDt8wJY6Zx1LGYAP9lnsyojqLlcmbKegr7QqH4ZpzDUCATAKW0R1Ya0kz4hSmxJO3vKNp1HNHoiKRQrHviw1xxUzKAiljFARhxBw3++rZ7cfUSv+WLNsKSlYj41bkfNEmV32pA4uxzg6XcgFU4FCj+02TD7C+brMtpNJ3Kzl50OQfgrT+js4qGVPGBdns7vc8SRhiHugcbESed2Up74WsTcc1ziL+Xcug33B3uqnWjgV9oKCbiJSzQb1Lw3TovBYTLcOaaYI5SXiISZtaoAlBT3vLVXVQ4IkQQeTr8X/WmuGsuAqirJyoEw0+/DGruri+QwXUHNb9qsQ2uSperXN9FhUVvtJjZajcmDEKupH/sa0Yjyo7IMOKvRHhlNPuyhaxk7KyDEKTpThnMNYhPrG937oXJXpaVBEnRzYkWzCLTGIoTH6gACGJNr0IKjYIe3OjYNK+C2f1fusHDtdfadficCnaIwJCTlAYFkSSOFOU8wsstmMepFRywt98jBuAZV1fc8lAQAdfHzqMxlBuJW7swPCWOtnvVYO78O8ahKY0xQKrNz/mscY4ZAT5Wt5bLmnkjvZChQpkdIFqMxpMlgXN26xtLEcuiTNqrJCWnTF+m+CmOF2SvYTh+4W2Jak03VgO+C7FVDRmK0QamRwvuHFQFeZHA1L/5S1WIWa6I905PPlB1UucmHpgEAyygLXAgsL5I0j3FuTaut077xzHPH5hi6jOxbl3GkxynkpV1kMNUdVcviMJSEyuQGwtgvToILG4QZiW9s1+d101UmYxuv3QvZz8ixx7cArrkse8nDI1UhjNAwLSobm8yAgE54pu/diSvTMYoIbK2PF12Zcq7xfyWakqKas/JPGWnBmRQzuZJLUHJ8y3VvtERu2cYKArJ5hBDjbvCg4khde93DK8sroGQvopZHjaR1kT6+E2JeMOKHBfkQnicx499w2y4+J6pcb9HfkgF+JECpIdAVI0B/0d3ky+2ruQ/3nmF0v/pN34OkFavEWM/teWf0Yo4xqLt1KEDuYrMbIbqJIcwq0Ac/WSj+rS6fCqvCWeSDTS7WsjFONhyE+8ddG4P7pyg6kucxOIup8osvrzcft5i4acWAXWESa1//Pjr9F5hOyD0N4kOLFBjWd2+JVYvAJHSC9dh6NL1Z5MKlwc0/SrRFS+ORqsmPktE2vBaS/iq55V61LWqme+sOUG5nPZAKTMQoTLhcJSPE2r66tbbP8flnFZbew/zkBUhliMAzTKBF3ySBjO6iylvZwBvjFMHCgetHT5bTFXg6fp3MiM9decW7o08PSzArYtdj65zHQLz0HS1QrQfL75WdtN+OA8oVChmv2AJwQltcZSXNLNIhpURubuOK9bBF1qUYkZtxB6Vk2+l8FoIfOnthy/1+MmE7oj7JCq9376WFLbWnWzxzjTFiZ6UWpSdsDvqQ9as13eHfS2tyWAmD/Q==",
          "2EuzoRd53dgitngJyLiRUEaIbqGLt/0PGQ07sl/sk4RURP/IfgE5t+IpMIUmtCi6xDfjVelNtLyk735uAbDtG4U7L/HGjNtY",
        ]
      );
    }
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
