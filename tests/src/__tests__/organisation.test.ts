import "expect-puppeteer";
import {
  deleteOrganisation,
  deleteUser,
  useSuperAdminAndOrga,
  connectWith,
  navigateWithReactRouter,
} from "../utils";

jest.setTimeout(30000);

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
    await expect(page).toMatch(
      "Créer une nouvelle organisation et un administrateur"
    );
    await expect(page).toFill("input[name=orgName]", "My First Orga");
    await expect(page).toClick(".modal-body button[type=submit]");
    await expect(page).toMatch("Veuillez saisir un nom pour l'administrateur");
    await expect(page).toFill("input[name=name]", "Test First Orga");
    await expect(page).toFill(
      "input[name=email]",
      "test+firstorga@example.org"
    );
    await expect(page).toFill("input[name=password]", "secret");
    await expect(page).toClick(".modal-body button[type=submit]");
    await expect(page).toMatch("Création réussie !");
  });

  it("should be able to disconnect in order to connect the new user", async () => {
    await page.goto("http://localhost:8090/auth");
    await expect(page).toMatch("Bienvenue Super !");
    await expect(page).toClick("button[type=button]");
  });

  it("should be able to connect as a new user", async () => {
    await connectWith("test+firstorga@example.org", "secret");
    await expect(page).toMatch("Charte des Utilisateurs de Mano");
    await page.evaluate(async (_) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          document?.querySelector(".main > div")?.scrollBy(0, 3000000);
          resolve("ok");
        }, 500);
      });
    });

    await expect(page).toMatch("Accepter et continuer");
    await expect(page).toClick("button[type=submit]", {
      text: "Accepter et continuer",
    });
  });

  it("should create a new team", async () => {
    await expect(page).toMatch("Bienvenue dans Mano !", { timeout: 2000 });
    await expect(page).toFill("input[name=name]", "my team");
    await expect(page).toClick("#create-team");

    await expect(page).toMatch("Création réussie !");
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
