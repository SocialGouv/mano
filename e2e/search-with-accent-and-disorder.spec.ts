import { test, expect } from "@playwright/test";
import { deleteAllPersons, populate } from "./scripts/populate-db";
import { loginWith } from "./utils";

test.beforeAll(async () => {
  await populate();
  await deleteAllPersons();
});

test("search in reception and user list using different order and accent", async ({ page }) => {
  await loginWith(page, "admin1@example.org");
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("azertyé qsdfghç");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("azertyé wxcvbn");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.locator("#search").click();
  await page.locator("#search").fill("qsDFghç AZrtyé");
  await page.getByText("azertyé qsdfghç").click();
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.locator("#search").click();
  await page.locator("#search").fill("wxcvbn");
  await page.getByText("azertyé wxcvbn").click();
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.locator("#search").click();
  await page.locator("#search").fill("azertyé");
  await page.getByText("(Total: 2)").click();
  await page.locator("#search").click();
  await page.locator("#search").fill("azertyé qsd");
  await page.getByText("(Total: 1)").click();
  await page.locator("#search").click();
  await page.locator("#search").fill("azertyé qsdm");
  await page.getByText("(Total: 0)").click();
  await page.getByRole("link", { name: "Accueil" }).click();
  await page.locator(".person-select-and-create-reception__input-container").click();
  await page.locator("#person-select-and-create-reception").fill("qsdfghç azertyé");
  await page.locator("#react-select-10-option-0").getByText("azertyé qsdfghç").click();
  await page.locator("#person-select-and-create-reception").fill("az");
  await page.locator("#react-select-10-option-1").getByText("azertyé wxcvbn").click();
});
