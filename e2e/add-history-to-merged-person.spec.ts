import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { changeReactSelectValue, clickOnEmptyReactSelect } from "./utils";

test("test", async ({ page }) => {
  // Always use a new items
  const originPersonName = nanoid();
  const originPersonOtherName = nanoid();
  const mergePersonName = nanoid();
  const mergePersonOtherName = nanoid();
  const mergedPersonOtherName = nanoid();

  await page.goto("http://localhost:8090/");

  await page.goto("http://localhost:8090/auth");

  await page.getByLabel("Email").click();

  await page.getByLabel("Email").fill("admin1@example.org");

  await page.getByLabel("Mot de passe").fill("secret");

  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");

  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

  /*

  Add a new team



  */

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(originPersonName);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByLabel("Autres pseudos").click();

  await page.getByLabel("Autres pseudos").fill(originPersonOtherName);

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(mergePersonName);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByLabel("Autres pseudos").click();

  await page.getByLabel("Autres pseudos").fill(mergePersonOtherName);

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("cell", { name: originPersonName }).click();

  await page.getByRole("button", { name: "Fusionner avec un autre dossier" }).click();

  await clickOnEmptyReactSelect(page, "person-to-merge-with-select", mergePersonName);

  await page.locator('[data-test-id="name"]').getByRole("cell", { name: originPersonName }).click();
  await page.locator('[data-test-id="name"]').getByRole("cell", { name: mergePersonName }).click();
  await page
    .locator('[data-test-id="otherNames"]')
    .getByRole("cell", { name: originPersonOtherName })
    .click();
  await page
    .locator('[data-test-id="otherNames"]')
    .getByRole("cell", { name: mergePersonOtherName })
    .click();

  await page
    .locator('[data-test-id="otherNames"] input[name="otherNames"]')
    .fill(mergedPersonOtherName);

  await page.getByRole("button", { name: "Fusionner" }).click();

  // // window.confirm not working on my tests
  // page.once("dialog", (dialog) => {
  //   if (dialog.message() === "Cette opération est irréversible, êtes-vous sûr ?") {
  //     dialog.accept().catch(() => {});
  //   }
  // });

  await page.locator(".Toastify__close-button").click();
  await page.locator('a:has-text("Historique")').click();

  await page
    .locator(
      `[data-test-id="Autres pseudos\\: \\"${originPersonOtherName}\\" ➔ \\"${mergedPersonOtherName}\\""]`
    )
    .click();

  await page
    .locator(`[data-test-id="Autres pseudos\\: \\"\\" ➔ \\"${originPersonOtherName}\\""]`)
    .click();
});
