import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith } from "./utils";

test.beforeAll(async () => {
  await populate();
});

test("Add history to merged person", async ({ page }) => {
  // Always use a new items
  const originPersonName = nanoid();
  const originPersonOtherName = nanoid();
  const mergePersonName = nanoid();
  const mergePersonOtherName = nanoid();
  const mergedPersonOtherName = nanoid();

  await loginWith(page, "admin3@example.org");

  /*

  Add a new team
  */

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(originPersonName);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Autres pseudos").fill(originPersonOtherName);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(mergePersonName);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Autres pseudos").fill(mergePersonOtherName);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("cell", { name: originPersonName }).click();

  await page.getByRole("button", { name: "Fusionner avec un autre dossier" }).click();

  await clickOnEmptyReactSelect(page, "person-to-merge-with-select", mergePersonName);

  await page.locator('[data-test-id="name"]').getByRole("cell", { name: originPersonName }).click();
  await page.locator('[data-test-id="name"]').getByRole("cell", { name: mergePersonName }).click();
  await page.locator('[data-test-id="otherNames"]').getByRole("cell", { name: originPersonOtherName }).click();
  await page.locator('[data-test-id="otherNames"]').getByRole("cell", { name: mergePersonOtherName }).click();

  await page.locator('[data-test-id="otherNames"] input[name="otherNames"]').fill(mergedPersonOtherName);

  page.once("dialog", (dialog) => dialog.accept());

  await page.getByRole("button", { name: "Fusionner" }).click();

  await page.locator(".Toastify__close-button").last().click();
  await page.getByRole("button", { name: "Historique" }).click();

  await expect(page.locator(`[data-test-id="Autres pseudos\\: \\"${originPersonOtherName}\\" ➔ \\"${mergedPersonOtherName}\\""]`)).toBeVisible();
  await expect(page.locator(`[data-test-id="Autres pseudos\\: \\"\\" ➔ \\"${originPersonOtherName}\\""]`)).toBeVisible();
  await expect(page.getByText(`Fusion avec : "${mergePersonName}"`)).toBeVisible();
});
