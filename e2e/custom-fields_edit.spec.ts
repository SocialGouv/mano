import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith } from "./utils";

test.beforeAll(async () => {
  await populate();
});

test("test", async ({ page }) => {
  const person1Name = nanoid();

  await loginWith(page, "admin1@example.org");

  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Ajouter un champ" }).nth(1).click();
  await page.getByLabel("Nom").fill("Champ non utilisé");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mise à jour !").click();
  await page.getByRole("button", { name: "Ajouter un champ" }).nth(1).click();
  await page.getByLabel("Nom").fill("Champ utilisé");
  await page.locator(".type__input-container").click();
  await page.locator("#react-select-type-option-7").click();
  await page.locator(".options__input-container").click();
  await page.getByLabel("Choix").fill("choix 1");
  await page.getByLabel("Choix").press("Enter");
  await page.getByLabel("Choix").fill("choix 2");
  await page.getByLabel("Choix").press("Enter");
  await page.getByLabel("Choix").fill("choix 3");
  await page.getByLabel("Choix").press("Enter");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mise à jour !").click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").fill(person1Name);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);

  await page.getByRole("button", { name: "Éditer les informations médicales" }).click();
  await clickOnEmptyReactSelect(page, "person-custom-select-champ-utilisé", "choix 1");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mis à jour !").click();

  await page.getByRole("link", { name: "Organisation" }).click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/organisation\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);

  await page.getByRole("button", { name: "Personnes suivies" }).click();

  await page.locator('[data-test-id="Champ utilisé"]').getByRole("button", { name: "Modifier le champ" }).click();
  await expect(page.locator(".type--is-disabled")).toBeVisible();
  await page.getByLabel("Nom").fill("Champ utilisé et modifié");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("choix 1, choix 2, choix 3")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Champ utilisé et modifié" })).toBeVisible();

  await page.locator('[data-test-id="Champ non utilisé"]').getByRole("button", { name: "Modifier le champ" }).click();
  await expect(page.locator(".type--is-disabled")).not.toBeVisible();

  await changeReactSelectValue(page, "type", "Zone de texte multi-lignes");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mise à jour !").click();
});
