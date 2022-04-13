import "expect-puppeteer";
import { setDefaultOptions } from "expect-puppeteer";
import {
  deleteOrganisation,
  deleteUser,
  useSuperAdminAndOrga,
  connectWith,
  navigateWithReactRouter,
  updateUserPassword,
} from "../utils";

jest.setTimeout(60000);
setDefaultOptions({ timeout: 60000 });

describe("Organisation CRUD", () => {
  beforeAll(async () => {
    // Prepare the test environment.
    await useSuperAdminAndOrga();
    await deleteOrganisation("My First Orga");
    await deleteUser("test+firstorga@example.org");
  });

  it("should be able to create organisation", async () => {
    await connectWith("superadmin@example.org", "secret");
    await expect(page).toMatch("Support");
    await expect(page).toClick("button[type=submit]");
    await expect(page).toMatch("Créer une nouvelle organisation et un administrateur");
    await expect(page).toFill("input[name=orgName]", "My First Orga");
    await expect(page).toClick(".modal-body button[type=submit]");
    await expect(page).toFill("input[name=name]", "Test First Orga");
    await expect(page).toFill("input[name=email]", "test+firstorga@example.org");
    await expect(page).toClick(".modal-body button[type=submit]");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await expect(page).toMatch("Création réussie !");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // We have to update the password of the user.
    await updateUserPassword("test+firstorga@example.org", "secret");
  });

  it("should be able to disconnect in order to connect the new user", async () => {
    await page.goto("http://localhost:8090/auth");
    await expect(page).toMatch("Bienvenue Super !");
    await expect(page).toClick("button[type=button]");
  });

  it("should be able to connect as a new user", async () => {
    await connectWith("test+firstorga@example.org", "secret");
    await expect(page).toMatch("Charte d'Utilisation de Mano");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await page.evaluate(async (_) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          document?.getElementById("charte")?.scrollBy(0, 3000000);
          resolve("ok");
        }, 500);
      });
    });
    await expect(page).toMatch("Accepter et continuer");
    await expect(page).toClick("button");
    await expect(page).toMatch("My First Orga");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await expect(page).toMatch("Bienvenue dans Mano !");
    await expect(page).toFill("input[name=encryptionKey]", "plouf");
    await expect(page).toFill("input[name=encryptionKeyConfirm]", "plouf");
    await expect(page).toClick("#encrypt");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await expect(page).toMatch("Dernière étape !");
    await expect(page).toFill("input[name=name]", "my team");
    await expect(page).toClick("#create-team");

    await expect(page).toMatch("Création réussie !");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await expect(page).toMatch("Équipes");
  });

  it("should navigate", async () => {
    await navigateWithReactRouter("/search");
    await expect(page).toMatch("Rechercher");

    await navigateWithReactRouter("/stats");
    await expect(page).toMatch("Statistiques");

    await navigateWithReactRouter("/team");
    await expect(page).toMatch("Équipes");

    await navigateWithReactRouter("/user");
    await expect(page).toMatch("Utilisateurs");

    await navigateWithReactRouter("/person");
    await expect(page).toMatch("Personnes suivies par l'organisation");

    await navigateWithReactRouter("/action");
    await expect(page).toMatch("Actions de l'équipe ");
  });
});
