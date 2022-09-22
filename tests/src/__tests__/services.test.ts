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
} from "../utils";

dayjs.extend(utc);
dayjs.locale("fr");

jest.setTimeout(100000);
setDefaultOptions({ timeout: 60000 });

describe("Organisation CRUD", () => {
  beforeAll(async () => {
    await useEncryptedOrga();
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    await expect(page).toMatch("Encrypted Orga", { timeout: 10000 });
  });

  it("should be able to update services in reception", async () => {
    await navigateWithReactRouter("/reception");
    await expect(page).toMatch(
      `Accueil du ${dayjs().format(
        "dddd D MMMM YYYY"
      )} de l'équipe Encrypted Orga Team`
    );
    await page.waitForTimeout(2000);
    await expect(page).toClick("button#Café-add");
    await page.waitForTimeout(500);
    expect(await getInputValue("input#Café-count")).toBe("1");
    await expect(page).toClick("button#Café-add");
    await page.waitForTimeout(500);
    expect(await getInputValue("input#Café-count")).toBe("2");
    await expect(page).toClick("button#Café-remove");
    await page.waitForTimeout(500);
    expect(await getInputValue("input#Café-count")).toBe("1");
    await page.waitForTimeout(1000);
    await expect(page).toClick("button#Douche-add");
    await expect(page).toClick("button#Douche-add");
    await expect(page).toClick("button#Douche-add");
    await page.waitForTimeout(500);
    expect(await getInputValue("input#Douche-count")).toBe("3");
    expect(await getInputValue("input#Café-count")).toBe("1");
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
    await page.waitForTimeout(500);
    await scrollDown();
    await page.waitForTimeout(500);
  });

  it("should be able to create previous report and update services too", async () => {
    await navigateWithReactRouter("/report");
    await page.waitForTimeout(1000);
    await expect(page).toMatch(
      "Comptes rendus de l'équipe Encrypted Orga Team"
    );
    await page.waitForTimeout(500);
    await expect(page).toClick("button", {
      text: dayjs().add(-1, "day").format("D"),
    });
    await page.waitForTimeout(500);
    await expect(page).toMatch(
      `Journée du ${dayjs().add(-1, "day").format("D MMMM YYYY")}`
    );
    await page.waitForTimeout(500);
    await expect(page).toClick("a#report-button-Accueil");
    await page.waitForTimeout(1000);
    expect(await getInputValue("input#Café-count")).toBe("0");
    await page.waitForTimeout(500);
    await expect(page).toClick("button#Douche-add");
    await expect(page).toClick("button#Douche-add");
    await page.waitForTimeout(500);
    expect(await getInputValue("input#Douche-count")).toBe("2");
  });

  it("should be able to update services names", async () => {
    await expect(page).toClick("a", { text: "Organisation" });
    await page.waitForTimeout(500);
    await expect(page).toClick("button", { text: "Accueil de jour" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("button#Douche-edit");
    await page.waitForTimeout(500);
    await expect(page).toFill('input[name="newContent"]', "Bain");
    await expect(page).toClick("button", { text: "Enregistrer" });
    await expect(page).toClick("button.Toastify__close-button");
    await expect(page).toMatch("Bain");
  });

  it("should be able to see updated services in reports", async () => {
    await navigateWithReactRouter("/reception");
    await expect(page).toMatch(
      `Accueil du ${dayjs().format(
        "dddd D MMMM YYYY"
      )} de l'équipe Encrypted Orga Team`
    );
    await page.waitForTimeout(2000);
    expect(await getInputValue("input#Café-count")).toBe("1");
    expect(await getInputValue("input#Bain-count")).toBe("3");

    await navigateWithReactRouter("/report");
    await page.waitForTimeout(1000);
    await expect(page).toMatch(
      "Comptes rendus de l'équipe Encrypted Orga Team"
    );
    await page.waitForTimeout(500);
    await expect(page).toClick("button", {
      text: dayjs().add(-1, "day").format("D"),
    });
    await page.waitForTimeout(500);
    await expect(page).toMatch(
      `Journée du ${dayjs().add(-1, "day").format("D MMMM YYYY")}`
    );
    await page.waitForTimeout(500);
    await expect(page).toClick("a#report-button-Accueil");
    await page.waitForTimeout(1000);
    expect(await getInputValue("input#Café-count")).toBe("0");
    expect(await getInputValue("input#Bain-count")).toBe("2");

    await navigateWithReactRouter("/report");
    await page.waitForTimeout(1000);
    await expect(page).toMatch(
      "Comptes rendus de l'équipe Encrypted Orga Team"
    );
    await page.waitForTimeout(500);
    await expect(page).toClick("button", { text: dayjs().format("D") });
    await page.waitForTimeout(500);
    await expect(page).toMatch(`Journée du ${dayjs().format("D MMMM YYYY")}`);
    await page.waitForTimeout(500);
    await scrollDown();
    await page.waitForTimeout(1000);
    expect(await getInputValue("input#Café-count")).toBe("1");
    expect(await getInputValue("input#Bain-count")).toBe("3");
  });
});
