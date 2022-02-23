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
  scrollTop,
  getInputValue,
  getInnerText,
} from "../utils";

dayjs.extend(utc);
dayjs.locale("fr");

jest.setTimeout(60000);
setDefaultOptions({ timeout: 10000 });

describe("Organisation CRUD", () => {
  beforeAll(async () => {
    await useEncryptedOrga();
  });

  /*
  Create a person to do some actions in the reception and check tha anonymous passages vs non-anonymous passages are well calculated
  */
  it("should be able to create a person and an action", async () => {
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
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Création réussie !");
    await expect(page).toClick("div.close-toastr");
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
    await expect(page).toClick("div.close-toastr");
  });

  it("should be able to update stuff in reception", async () => {});
});
