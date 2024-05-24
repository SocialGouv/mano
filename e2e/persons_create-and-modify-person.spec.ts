import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { clickOnEmptyReactSelect, loginWith } from "./utils";

test.beforeAll(async () => {
  await populate();
});

// This test uses admin1@example.org
// It creates a random person and then modifies it.
// It could be used as an example for writing new tests.
test("Create and modify a person", async ({ page }) => {
  // Always use a new person name
  const personName = nanoid();

  await loginWith(page, "admin1@example.org");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(personName);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Autres pseudos").click();
  await page.getByLabel("Autres pseudos").fill("deuxième pseudo");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Autres pseudos").click();
  await page.getByLabel("Nom prénom ou Pseudonyme").click();
  await page.getByLabel("Date de naissance").fill("2022-10-10");
  await page.getByLabel("Date de naissance").press("Enter");
  await page.getByLabel("En rue depuis le").fill("2022-10-10");
  await page.getByLabel("En rue depuis le").press("Enter");
  await page.getByLabel("Personne très vulnérable, ou ayant besoin d'une attention particulière").check();
  await page.getByLabel("Téléphone").click();

  await page.getByLabel("Téléphone").fill("0123456789");
  await page.getByLabel("Description").fill("Test de description");

  await page.getByRole("dialog").getByText("Informations sociales").click();
  await clickOnEmptyReactSelect(page, "person-custom-select-situation-personnelle", "Famille");
  await page.getByLabel("Structure de suivi social").click();
  await page.getByLabel("Structure de suivi social").fill("aucune");
  await page.locator(".person-custom-select-avec-animaux__value-container").click();
  await page.getByText("Oui", { exact: true }).click();
  await page.locator(".person-custom-select-hébergement__value-container").click();
  await page.locator(".person-custom-select-hébergement__menu").getByText("Oui", { exact: true }).click();
  await page.locator(".person-custom-select-type-dhébergement__value-container").click();
  await page.getByText("Logement", { exact: true }).click();
  await page.locator(".person-custom-select-nationalité__value-container").click();
  await page.getByText("UE", { exact: true }).click();
  await page.locator(".person-custom-select-emploi__value-container").click();
  await page.getByText("CDD", { exact: true }).click();
  await page.locator(".person-custom-select-ressources__value-container").click();
  await page.getByText("SANS", { exact: true }).click();
  await page.locator(".person-custom-select-motif-de-la-situation-en-rue__value-container").click();
  await page.getByText("Départ de région", { exact: true }).click();

  await page.getByRole("dialog").getByText("Informations de santé").click();
  await page.getByLabel("Structure de suivi médical").click();
  await page.getByLabel("Structure de suivi médical").fill("fdfdfs");
  await page.locator(".person-custom-select-consommations__value-container").click();
  await page.getByText("Alcool", { exact: true }).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await page.getByRole("button", { name: "Ajouter un traitement" }).click();
  await page.getByPlaceholder("Amoxicilline").click();
  await page.getByPlaceholder("Amoxicilline").fill("dsqdsqdsq");
  await page.getByPlaceholder("1mg").click();
  await page.getByPlaceholder("1mg").fill("dsqdsq");
  await page.getByPlaceholder("1 fois par jour").click();
  await page.getByPlaceholder("1 fois par jour").fill("sqdsdqs");
  await page.getByPlaceholder("Angine").click();
  await page.getByPlaceholder("Angine").fill("dsqdsqdqs");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").last().click();
});
