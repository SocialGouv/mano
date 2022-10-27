import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import reactSelect from "./utils";

// This test uses admin1@example.org
// It creates a random person and then modifies it.
// It could be used as an example for writing new tests.
test("Create and modify a person", async ({ page }) => {
  // Always use a new person name
  const personName = nanoid();

  await page.goto("http://localhost:8090/");
  await page.goto("http://localhost:8090/auth");

  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("admin1@example.org");
  await page.getByLabel("Email").press("Enter");

  await page.getByLabel("Mot de passe").click();
  await page.getByLabel("Mot de passe").fill("secret");

  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.getByLabel("Clé de chiffrement d'organisation").press("Meta+a");
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");

  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page
    .getByRole("button", { name: "Créer une nouvelle personne" })
    .click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(personName);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);

  await page.getByLabel("Autres pseudos").click();
  await page.getByLabel("Autres pseudos").fill("deuxième pseudo");

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.getByText("Mis à jour !").click();

  await page.getByLabel("Autres pseudos").click();
  await page.getByLabel("Nom prénom ou Pseudonyme").click();

  await page.getByLabel("Date de naissance").fill("10/10/2022");
  await page.getByLabel("En rue depuis le").fill("10/10/2022");

  await page
    .getByLabel(
      "Personne très vulnérable, ou ayant besoin d'une attention particulière"
    )
    .check();

  await page.getByLabel("Téléphone").click();
  await page.getByLabel("Téléphone").fill("0123456789");

  await page.getByLabel("Description").click();
  await page.getByLabel("Description").fill("Test de description");

  await reactSelect(page, "personalSituation", "Famille");

  await page.getByLabel("Structure de suivi social").click();
  await page.getByLabel("Structure de suivi social").fill("aucune");

  await page.locator(".person-select-animals__value-container").click();
  await page.getByText("Oui", { exact: true }).click();

  await page.locator(".person-select-address__placeholder").click();
  await page
    .locator(".person-select-address__menu")
    .getByText("Oui", { exact: true })
    .click();

  await page.locator(".person-select-addressDetail__value-container").click();
  await page.getByText("Logement", { exact: true }).click();

  await page
    .locator(".person-select-nationalitySituation__value-container")
    .click();
  await page.getByText("UE", { exact: true }).click();

  await page.locator(".person-select-employment__value-container").click();
  await page.getByText("CDD", { exact: true }).click();

  await page.locator(".person-select-resources__value-container").click();
  await page.getByText("SANS", { exact: true }).click();

  await page.locator(".person-select-reasons__value-container").click();
  await page.getByText("Départ de région", { exact: true }).click();

  await page.getByLabel("Structure de suivi médical").click();
  await page.getByLabel("Structure de suivi médical").fill("fdfdfs");

  await page
    .locator(".person-custom-select-consumptions__value-container")
    .click();
  await page.getByText("Alcool", { exact: true }).click();

  await page.getByRole("button", { name: "Mettre à jour" }).click();

  await page.getByText("Mis à jour !").click();

  await page.locator('a:has-text("Dossier Médical")').click();
  await expect(page).toHaveURL(
    /http:\/\/localhost:8090\/person\/.*\?tab=dossier\+m%C3%A9dical/
  );

  await page.getByRole("button", { name: "💊 Ajouter un traitement" }).click();

  await page.getByPlaceholder("Amoxicilline").click();
  await page.getByPlaceholder("Amoxicilline").fill("dsqdsqdsq");

  await page.getByPlaceholder("1mg").click();
  await page.getByPlaceholder("1mg").fill("dsqdsq");

  await page.getByPlaceholder("1 fois par jour").click();
  await page.getByPlaceholder("1 fois par jour").fill("sqdsdqs");

  await page.getByPlaceholder("Angine").click();
  await page.getByPlaceholder("Angine").fill("dsqdsqdqs");

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Traitement créé !").click();
});
