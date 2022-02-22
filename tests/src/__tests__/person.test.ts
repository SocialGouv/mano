import dayjs from "dayjs";
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
setDefaultOptions({ timeout: 30000 });

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
    await expect(page).toClick("div.close-toastr");
    await scrollDown();
    await expect(page).toClick("button", { text: "Mettre à jour" });
    await expect(page).toMatch("Mis à jour !");
    await expect(page).toClick("div.close-toastr");
  });

  it("should see created person", async () => {
    await navigateWithReactRouter("/person");
    await expect(page).toMatch("Ma première personne");
  });

  it("should be able to check tabs for this person", async () => {
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", { text: "Ma première personne" });
    await scrollTop();
    await expect(page).toClick("a", { text: "Actions (0)" });
    await expect(page).toClick("a", { text: "Lieux (0)" });
    await expect(page).toClick("a", { text: "Commentaires (0)" });
    await expect(page).toClick("a", { text: "Documents (0)" });
  });

  /*
  COMMENT CREATION
  */

  it("should be able to create a comment for this person", async () => {
    await expect(page).toClick("a", { text: "Commentaires (0)" });
    await expect(page).toClick("button", { text: "Ajouter un commentaire" });
    await expect(page).toMatch("Créér un commentaire", { timeout: 4000 });
    await expect(page).toFill('textarea[name="comment"]', "Ceci est un commentaire");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Ceci est un commentaire");
  });

  it("should be able to create another comment for this person", async () => {
    await expect(page).toClick("a", { text: "Commentaires (1)" });
    await expect(page).toClick("button", { text: "Ajouter un commentaire" });
    await expect(page).toMatch("Créér un commentaire", { timeout: 4000 });
    await expect(page).toFill('textarea[name="comment"]', "Ceci est un autre commentaire");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Ceci est un commentaire");
    await expect(page).toMatch("Ceci est un autre commentaire");
  });

  /*
  ACTION CREATION
  */

  it("should add action", async () => {
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Actions (0)" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", { text: "Créer une nouvelle action" });
    await expect(page).toFill("input#create-action-name", "Mon action");
    await expect(page).toClick("input#create-action-team-select");
    await expect(page).toClick("div.create-action-team-select__option");
    await expect(page).toMatch("Encrypted Orga Admin");
    await expect(page).toMatch("Ma première personne");
    await expect(page).toMatch("À FAIRE");
    const dueAt = await page
      .$("input#create-action-dueat")
      .then((input) => input?.getProperty("value"))
      .then((value) => value?.jsonValue());

    expect(dueAt).toBe(dayjs().format("DD/MM/YYYY"));
    await expect(page).toFill(
      "textarea#create-action-description",
      "Une petite description pour la route"
    );
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Création réussie !");
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Mon action");
    await expect(page).toMatch("À FAIRE");
    await expect(page).toMatch("(créée par Encrypted Orga Admin)");
    await expect(page).toMatch("Une petite description pour la route");
    await expect(page).toClick("a", { text: "Retour" });
    await expect(page).toMatch("Dossier de Ma première personne");
    await expect(page).toClick("a", { text: "Commentaires (2)" });
    await expect(page).toClick("a", { text: "Actions (1)" });
    await expect(page).toClick("td", { text: "Mon action" });
    await expect(page).toClick("a", { text: "Retour" });
    await expect(page).toMatch("Mon action");
    await expect(page).toMatch("A FAIRE");
    await expect(page).toMatch("(créée par Encrypted Orga Admin)");
  });

  /*
  PLACE CREATION
  */

  it("should add a place", async () => {
    await navigateWithReactRouter("/place");
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", { text: "Créer un nouveau lieu fréquenté" });
    await page.waitForTimeout(1000);
    await expect(page).toFill("input#create-place-name", "Mon lieu fréquenté");
    await expect(page).toClick("button#create-place-button");
    await page.waitForTimeout(1000);
    await expect(page).toClick("div.close-toastr");
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", { text: "Ma première personne" });
    await scrollTop();
    await expect(page).toClick("a", { text: "Lieux (0)" });
    await expect(page).toClick("button", { text: "Ajouter un lieu" });
    await expect(page).toClick("input#add-place-select-place");
    await expect(page).toClick("div.add-place-select-place__option");
    await expect(page).toMatch("Mon lieu fréquenté");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await expect(page).toMatch("Lieu ajouté !");
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Mon lieu fréquenté");
    await expect(page).toMatch("Lieux (1)");
  });

  /*
  RELOAD AND CHECK EVERYTHING IS HERE
  */

  it("should have all the created data showing on reload", async () => {
    await page.goto("http://localhost:8090/auth");
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    await expect(page).toMatch("Encrypted Orga", { timeout: 4000 });
    await navigateWithReactRouter("/person");
    await expect(page).toMatch("Personnes suivies par l'organisation");
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Ma première personne");
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", { text: "Ma première personne" });
    await scrollTop();
    await expect(page).toClick("a", { text: "Actions (1)" });
    await expect(page).toMatch("Mon action");
    await expect(page).toMatch("A FAIRE");
    await expect(page).toClick("td", { text: "Mon action" });
    await expect(page).toMatch("Mon action");
    await expect(page).toMatch("À FAIRE");
    await expect(page).toMatch("Une petite description pour la route");
    await expect(page).toClick("a", { text: "Retour" });
    await expect(page).toClick("a", { text: "Documents (0)" });
    await expect(page).toClick("a", { text: "Commentaires (2)" });
    await expect(page).toMatch("Ceci est un commentaire");
    await expect(page).toMatch("Ceci est un autre commentaire");
    await expect(page).toClick("a", { text: "Lieux (1)" });
    await expect(page).toMatch("Mon lieu fréquenté");
  });
});
