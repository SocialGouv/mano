import dayjs from "dayjs";
import "expect-puppeteer";
import { setDefaultOptions } from "expect-puppeteer";
import {
  connectWith,
  navigateWithReactRouter,
  useEncryptedOrga,
  getInputValue,
  getInnerText,
} from "../utils";

jest.setTimeout(60000);
setDefaultOptions({ timeout: 10000 });

describe("Organisation CRUD", () => {
  beforeAll(async () => {
    await useEncryptedOrga();
  });

  it("should be able to create a territory", async () => {
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    await expect(page).toMatch("Encrypted Orga", { timeout: 4000 });
    await navigateWithReactRouter("/territory");
    await expect(page).toMatch("Territoires de l'organisation Encrypted orga");
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", {
      text: "Créer un nouveau territoire",
    });
    await expect(page).toFill('input[name="name"]', "Mon premier territoire");
    await expect(page).toClick("input#territory-select-types");
    await expect(page).toClick("div.territory-select-types__option");
    await expect(page).toFill('input[name="perimeter"]', "Entre ici et là");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Création réussie !");
    await expect(page).toClick("div.close-toastr");
    expect(await getInputValue('input[name="name"]')).toBe("Mon premier territoire");
    expect(await getInputValue('input[name="perimeter"]')).toBe("Entre ici et là");
    expect(await getInnerText("div.territory-select-types__multi-value__label")).toBe(
      "Lieu de conso"
    );
  });

  it("should be able to create an observation", async () => {
    await expect(page).toClick("button", { text: "Nouvelle observation" });
    await expect(page).toFill('input[name="personsMale"]', "4");
    await expect(page).toFill('input[name="personsFemale"]', "5");
    await expect(page).toClick("input#observation-custom-select-police");
    await expect(page).toClick("div.observation-custom-select-police__option");
    await expect(page).toFill('input[name="material"]', "6");
    await expect(page).toFill('input[name="mediation"]', "7");
    await expect(page).toFill('textarea[name="comment"]', "No comment");
    await expect(page).toClick("input#observation-custom-select-atmosphere");
    await expect(page).toClick("div.observation-custom-select-atmosphere__option");
    await expect(page).toFill("input#observation-createdat", "20/04/2019");
    await page.keyboard.press("Escape");
    await expect(page).toClick("input#observation-select-team");
    await expect(page).toClick("div.observation-select-team__option");
    await expect(page).toClick("input#observation-select-territory");
    await expect(page).toClick("div.observation-select-territory__option");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Création réussie !");
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Nombre de personnes non connues hommes rencontrées: 4");
    await expect(page).toMatch("Nombre de personnes non connues femmes rencontrées: 5");
    await expect(page).toMatch("Présence policière: Oui");
    await expect(page).toMatch("Nombre de matériel ramassé: 6");
    await expect(page).toMatch("Ambiance: Violences");
    await expect(page).toMatch("Nombre de médiations avec les riverains / les structures: 7");
    await expect(page).toMatch("Commentaire:");
    await expect(page).toMatch("No comment");
  });

  it("should have all the created data showing on reload", async () => {
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    await expect(page).toMatch("Encrypted Orga", { timeout: 4000 });
    await navigateWithReactRouter("/territory");
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Territoires de l'organisation Encrypted orga");
    await expect(page).toMatch("Mon premier territoire");
    await expect(page).toClick("td", { text: "Mon premier territoire" });

    await page.waitForTimeout(1000);

    expect(await getInputValue('input[name="name"]')).toBe("Mon premier territoire");
    expect(await getInputValue('input[name="perimeter"]')).toBe("Entre ici et là");
    expect(page).toMatch("Lieu de conso");

    await expect(page).toMatch("Nombre de personnes non connues hommes rencontrées: 4");
    await expect(page).toMatch("Nombre de personnes non connues femmes rencontrées: 5");
    await expect(page).toMatch("Présence policière: Oui");
    await expect(page).toMatch("Nombre de matériel ramassé: 6");
    await expect(page).toMatch("Ambiance: Violences");
    await expect(page).toMatch("Nombre de médiations avec les riverains / les structures: 7");
    await expect(page).toMatch("Commentaire:");
    await expect(page).toMatch("No comment");
  });
});
