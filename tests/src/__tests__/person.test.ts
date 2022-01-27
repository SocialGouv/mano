import "expect-puppeteer";
import { setDefaultOptions } from "expect-puppeteer";
import {
  connectWith,
  navigateWithReactRouter,
  useEncryptedOrga,
  scrollDown,
  scrollTop,
} from "../utils";

jest.setTimeout(30000);
setDefaultOptions({ timeout: 5000 });

describe("Organisation CRUD", () => {
  beforeAll(async () => {
    await useEncryptedOrga();
  });

  it("should be able to create a person", async () => {
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    await expect(page).toMatch("Encrypted Orga", { timeout: 4000 });
    await navigateWithReactRouter("/person");
    await expect(page).toMatch("Personnes suivies par l'organisation");
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", {
      text: "Créer une nouvelle personne",
    });
    await expect(page).toFill('input[name="name"]', "Ma première personne");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await expect(page).toMatch("Dossier de Ma première personne");
    await expect(page).toFill('input[name="otherNames"]', "autre nom");
    await expect(page).toMatch("Création réussie !");
    await scrollDown();
    await expect(page).toClick("button", { text: "Mettre à jour" });
    await expect(page).toMatch("Mis à jour !");
  });

  it("should see created person", async () => {
    await navigateWithReactRouter("/person");
    await expect(page).toMatch("Ma première personne");
  });

  it("should be able to check tabs for this person", async () => {
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", {
      text: "Ma première personne",
    });
    await scrollTop();
    await expect(page).toClick("a", { text: "Actions" });
    await expect(page).toClick("a", { text: "Lieux" });
  });

  it("should add comment", async () => {
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", {
      text: "Ma première personne",
    });
    await page.waitForTimeout(1000);
    await scrollTop();
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Commentaires" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", { text: "Ajouter un commentaire" });
    await expect(page).toFill('textarea[name="comment"]', "Mon commentaire");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await expect(page).toMatch("Commentaire ajouté !");
  });

  it("should add action", async () => {
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", {
      text: "Ma première personne",
    });
    await scrollTop();
    await expect(page).toClick("a", { text: "Actions" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", { text: "Créer une nouvelle action" });
    await expect(page).toFill('input[name="name"]', "Mon action");
  });
});
