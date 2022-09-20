import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import "expect-puppeteer";
import { setDefaultOptions } from "expect-puppeteer";
import {
  connectWith,
  navigateWithReactRouter,
  useEncryptedOrga,
  scrollDown,
  getInputValue,
  getInnerText,
} from "../utils";

dayjs.extend(utc);
dayjs.locale("fr");

jest.setTimeout(120000);
setDefaultOptions({ timeout: 100000 });

describe("Organisation CRUD", () => {
  beforeAll(async () => {
    await useEncryptedOrga();
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    await expect(page).toMatch("Encrypted Orga", { timeout: 10000 });
  });

  it("should be able to update stuff in reception", async () => {
    await navigateWithReactRouter("/reception");
    await expect(page).toMatch(
      `Accueil du ${dayjs().format(
        "dddd D MMMM YYYY"
      )} de l'équipe Encrypted Orga Team`
    );
    await page.waitForTimeout(2000);

    expect(await getInnerText("h5#passages-title")).toBe("0 passage");
    await expect(page).toClick("button#add-anonymous-passage");
    await page.waitForTimeout(1000);
    expect(await getInnerText("h5#passages-title")).toBe("1 passage");
    await expect(page).toClick("button#add-anonymous-passage");
    await page.waitForTimeout(1000);
    expect(await getInnerText("h5#passages-title")).toBe("2 passages");

    await expect(page).toClick("button#Café-add");
    await page.waitForTimeout(1500);
    expect(await getInputValue("input#Café-count")).toBe("1");
    await page.waitForTimeout(1000);
    await expect(page).toClick("button#Café-add");
    await page.waitForTimeout(1000);
    expect(await getInputValue("input#Café-count")).toBe("2");
    await page.waitForTimeout(1000);
    await expect(page).toClick("button#Café-remove");
    await page.waitForTimeout(1000);
    expect(await getInputValue("input#Café-count")).toBe("1");
  });

  /*
  Create a person to do some actions in the reception and check tha anonymous passages vs non-anonymous passages are well calculated
  */
  it("should be able to create a person and an action", async () => {
    await navigateWithReactRouter("/person");
    await expect(page).toMatch("Personnes suivies par l'organisation");
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", {
      text: "Créer une nouvelle personne",
    });
    await expect(page).toFill('input[name="name"]', "Ma première personne");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Création réussie !");
    await expect(page).toClick("div.Toastify__close-button");
    await expect(page).toMatch("Dossier de Ma première personne");
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Actions (0)" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", { text: "Créer une nouvelle action" });
    await expect(page).toFill("input#create-action-name", "Mon action");
    await expect(page).toClick("input#create-action-team-select");
    await expect(page).toClick("div.create-action-team-select__option");
    await expect(page).toMatch("Encrypted Orga Admin");
    await expect(page).toMatch("Ma première personne");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Création réussie !");
    await expect(page).toClick("div.Toastify__close-button");
  });

  it("should be able to see the action in reception", async () => {
    await navigateWithReactRouter("/reception");
    await expect(page).toMatch(
      `Accueil du ${dayjs().format(
        "dddd D MMMM YYYY"
      )} de l'équipe Encrypted Orga Team`
    );
    await expect(page).toMatch("Mon action");
  });

  it("should be able to add a passage", async () => {
    await navigateWithReactRouter("/reception");
    await expect(page).toMatch(
      `Accueil du ${dayjs().format(
        "dddd D MMMM YYYY"
      )} de l'équipe Encrypted Orga Team`
    );
    await expect(page).toClick("input#person-select-and-create-reception");
    await expect(page).toClick(
      "div.person-select-and-create-reception__option"
    );
    expect(
      await getInnerText(
        "div.person-select-and-create-reception__multi-value__label"
      )
    ).toBe(
      `Ma première personne

Accéder au dossier`
    );
    await expect(page).toClick("button", { text: "Passage" });
    await page.waitForTimeout(1000);
    expect(await getInnerText("h5#passages-title")).toBe("3 passages");
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", { text: "Ma première personne" });
    await expect(page).toClick("a", { text: "Passages (1)" });
  });

  it("should be able go in the report", async () => {
    await navigateWithReactRouter("/report");
    await page.waitForTimeout(1000);
    await expect(page).toMatch(
      "Comptes rendus de l'équipe Encrypted Orga Team"
    );
    await expect(page).toClick("button", { text: dayjs().format("D") });
    await page.waitForTimeout(1000);
    await expect(page).toMatch(`Compte rendu de l'équipe Encrypted Orga Team`);
    await expect(page).toMatch(`Journée du ${dayjs().format("D MMMM YYYY")}`);
  });

  it("should be able to go to previous report then next report", async () => {
    await navigateWithReactRouter("/report");
    await page.waitForTimeout(2000);
    await expect(page).toMatch(
      "Comptes rendus de l'équipe Encrypted Orga Team"
    );
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", {
      text: dayjs().add(-1, "day").format("D"),
    });
    await page.waitForTimeout(1000);
    await expect(page).toMatch(
      `Journée du ${dayjs().add(-1, "day").format("D MMMM YYYY")}`
    );
    await expect(page).toClick("button", { text: "Suivant" });
    await expect(page).toMatch(`Journée du ${dayjs().format("D MMMM YYYY")}`);
    await expect(page).toClick("button", { text: "Précédent" });
    await expect(page).toMatch(
      `Journée du ${dayjs().add(-1, "day").format("D MMMM YYYY")}`
    );
    await expect(page).toClick("button", { text: "Suivant" });
    await page.waitForTimeout(1000);
  });

  it("should be able to modify services in the report", async () => {
    await expect(page).toClick("a#report-button-Accueil");
    await page.waitForTimeout(1000);
    expect(await getInputValue("input#Café-count")).toBe("1");
    await page.waitForTimeout(1000);
    await expect(page).toClick("button#Douche-add");
    await page.waitForTimeout(1000);
    expect(await getInputValue("input#Douche-count")).toBe("1");
    await expect(page).toClick("button#Douche-add");
    await page.waitForTimeout(1000);
    expect(await getInputValue("input#Douche-count")).toBe("2");
    await expect(page).toClick("button#Douche-remove");
    await page.waitForTimeout(2000);
    expect(await getInputValue("input#Douche-count")).toBe("1");
  });

  it("should be able to see passages in the report", async () => {
    await expect(page).toClick("a", { text: "Passages (3)" });
    await page.waitForTimeout(1000);
    expect(await getInnerText("span#report-passages-anonymous-count")).toBe(
      "2"
    );
    expect(await getInnerText("span#report-passages-non-anonymous-count")).toBe(
      "1"
    );
    await expect(page).toMatch("Ma première personne");
    await expect(page).toMatch("Anonyme");
  });

  it("should be able to see actions in the report", async () => {
    await expect(page).toClick("a", { text: "Actions complétées (0)" });
    await expect(page).toClick("a", { text: "Actions annulées (0)" });
    await expect(page).toClick("a", { text: "Actions créées (1)" });
  });

  it("should be able to see actions updated to DONE in the report", async () => {
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Actions créées (1)" });
    await page.waitForTimeout(1000);
    await scrollDown();
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Mon action");
    await expect(page).toClick("td", { text: "Mon action" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("input#update-action-select-status");
    await expect(page).toClick(
      "div.update-action-select-status__option:nth-of-type(2)"
    );
    expect(
      await getInnerText("div.update-action-select-status__single-value")
    ).toBe("FAITE");
    await scrollDown();
    await expect(page).toClick("button", { text: "Mettre à jour" });
    await expect(page).toMatch("Mise à jour !");
    await expect(page).toClick("div.Toastify__close-button");
    await expect(page).toClick("a", { text: "Retour" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Actions annulées (0)" });
    await expect(page).toClick("a", { text: "Actions créées (0)" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Actions complétées (1)" });
  });

  it("should be able to see actions updated to CANCELED in the report", async () => {
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Actions complétées (1)" });
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Mon action");
    await expect(page).toClick("td", { text: "Mon action" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("input#update-action-select-status");
    await expect(page).toClick(
      "div.update-action-select-status__option:nth-of-type(3)"
    );
    expect(
      await getInnerText("div.update-action-select-status__single-value")
    ).toBe("ANNULÉE");
    await scrollDown();
    await page.evaluate(
      `window.originalConfirm = window.confirm;window.confirm = () => false; `
    ); // to skip the confirmation
    await expect(page).toClick("button", { text: "Mettre à jour" });
    await expect(page).toMatch("Mise à jour !");
    await expect(page).toClick("div.Toastify__close-button");
    await page.waitForTimeout(1000);
    await page.evaluate(`window.confirm = window.originalConfirm;`); // to put back the original behavior
    await expect(page).toClick("a", { text: "Retour" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Actions complétées (0)" });
    await expect(page).toClick("a", { text: "Actions créées (0)" });
    await expect(page).toClick("a", { text: "Actions annulées (1)" });
  });

  it("should be able to see actions comments in the report", async () => {
    await expect(page).toClick("a", { text: "Commentaires (2)" });
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Mon action");
    await expect(page).toMatch(
      "Encrypted Orga Admin a changé le status de l'action: FAITE"
    );
    await expect(page).toMatch(
      "Encrypted Orga Admin a changé le status de l'action: ANNULÉE"
    );
  });

  it("should be able to add a collaboration", async () => {
    await expect(page).toMatch(`Compte rendu de l'équipe Encrypted Orga Team`);
    await page.waitForTimeout(1000);
    await expect(page).toMatch(`Journée du ${dayjs().format("D MMMM YYYY")}`);
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Résumé" });
    await page.waitForTimeout(1000);
    await expect(page).toFill(
      "input#report-select-collaboration",
      "Ma deuxième collab"
    );
    await expect(page).toClick("div.report-select-collaboration__option");
    await expect(page).toClick("button", { text: "Mettre à jour" });
    await expect(page).toMatch("Mis à jour !");
    await expect(page).toClick("div.Toastify__close-button");
    // await expect(page).toMatch("Ma première collab");
    await expect(page).toMatch("Ma deuxième collab");
  });

  it("should be able to use an added collaboration", async () => {
    await navigateWithReactRouter("/report");
    await page.waitForTimeout(1000);
    await expect(page).toMatch(
      "Comptes rendus de l'équipe Encrypted Orga Team"
    );
    await expect(page).toClick("button", {
      text: dayjs().add(-1, "day").format("D"),
    });
    await page.waitForTimeout(1000);
    await expect(page).toMatch(
      `Journée du ${dayjs().add(-1, "day").format("D MMMM YYYY")}`
    );
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Résumé" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("input#report-select-collaboration");
    await expect(page).toClick("div.report-select-collaboration__option");
    await expect(page).toClick("button", { text: "Mettre à jour" });
    await expect(page).toMatch("Mis à jour !");
    await expect(page).toClick("div.Toastify__close-button");
    await expect(page).toMatch("Description", { timeout: 2000 });
    await expect(page).toMatch("Ma deuxième collab");
  });

  it("should be able to use add a description", async () => {
    await navigateWithReactRouter("/report");
    await page.waitForTimeout(1000);
    await expect(page).toMatch(
      "Comptes rendus de l'équipe Encrypted Orga Team"
    );
    await expect(page).toClick("button", {
      text: dayjs().add(-1, "day").format("D"),
    });
    await page.waitForTimeout(1000);
    await expect(page).toMatch(
      `Journée du ${dayjs().add(-1, "day").format("D MMMM YYYY")}`
    );
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Résumé" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", { text: "Ajouter une description" });
    await expect(page).toMatch("Description", { timeout: 10000 });
    await expect(page).toFill(
      'textarea[name="description"]',
      "Ceci est une description"
    );
    await expect(page).toClick("button", { text: "Enregistrer" });
    await expect(page).toClick("div.Toastify__close-button");
    await expect(page).toMatch("Description", { timeout: 2000 });
    await expect(page).toMatch("Ceci est une description");
  });
});
