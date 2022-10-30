import { test, expect } from "@playwright/test";
import { changeReactSelectValue, clickOnEmptyReactSelect } from "./utils";

test("Create custom fields filtered by team", async ({ page }) => {
  test.setTimeout(60000);

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

  Add the custom fields



  */

  await page.getByRole("link", { name: "Organisation" }).click();

  await page.getByRole("button", { name: "Personnes suivies" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).first().click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("Test champ perso infos sociales");

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("button", { name: "Ajouter un champ" }).nth(1).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("Test champ perso info médicales");

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("button", { name: "Dossier Médical 🧑‍⚕️" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("Test champ perso dossier médical");

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("button", { name: "Consultations 🧑‍⚕️" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("Test champ perso consultation");

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("button", { name: "Territoires" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("Test champ perso observation");

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").click();

  /*

  Check that the fields exist and update their value



  */

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("Test personne");

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await changeReactSelectValue(page, "team-selector-topBar", "Team Test - 1");

  await page.getByLabel("Test champ perso infos sociales").click();

  await page.getByLabel("Test champ perso info médicales").click();

  await page.locator('a:has-text("Dossier Médical")').click();

  await page.getByLabel("Test champ perso dossier médical").click();

  await page.getByRole("button", { name: "🩺 Ajouter une consultation" }).click();

  await page.getByRole("textbox", { name: "Nom" }).fill("Consult");

  await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");

  await page.getByLabel("Test champ perso consultation").click();

  await page.getByLabel("Test champ perso consultation").fill("Super");

  await page.getByRole("button", { name: "Sauvegarder" }).click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");

  await page.getByRole("button", { name: "Créer un nouveau territoire" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("Test territoire");

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("button", { name: "Nouvelle observation" }).click();

  await page.getByLabel("Test champ perso observation").click();

  await page.getByLabel("Test champ perso observation").fill("Magique");

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").click();

  /*

  Add a new team



  */

  await page.getByRole("link", { name: "Équipes" }).click();
  await expect(page).toHaveURL("http://localhost:8090/team");

  await page.getByRole("button", { name: "Créer une nouvelle équipe" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("Team exclue champs persos");

  await page.getByLabel("Non").check();

  await page.getByRole("button", { name: "Créer" }).click();
  await page.locator(".Toastify__close-button").click();

  /*

  Restrict the fields to the team



  */

  await page.getByRole("link", { name: "Organisation" }).click();

  await page.getByRole("button", { name: "Personnes suivies" }).click();

  await page
    .getByRole("row", {
      name: "✎ Test champ perso infos sociales Texte Toute l'organisation Supprimer",
    })
    .getByLabel("Toute l'organisation")
    .uncheck();

  await page.getByLabel("Team exclue champs persos").uncheck();

  await page.getByRole("button", { name: "Mettre à jour" }).nth(1).click();
  await page.locator(".Toastify__close-button").click();

  await page
    .getByRole("row", {
      name: "✎ Test champ perso info médicales Texte Toute l'organisation Supprimer",
    })
    .getByLabel("Toute l'organisation")
    .uncheck();

  await page
    .getByRole("row", {
      name: "✎ Test champ perso info médicales Texte Toute l'organisation Team Test - 1 Team exclue champs persos Supprimer",
    })
    .getByLabel("Team exclue champs persos")
    .uncheck();

  await page.getByRole("button", { name: "Mettre à jour" }).nth(2).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("button", { name: "Dossier Médical 🧑‍⚕️" }).click();

  await page
    .getByRole("row", {
      name: "✎ Test champ perso dossier médical Texte Toute l'organisation Supprimer",
    })
    .getByLabel("Toute l'organisation")
    .uncheck();

  await page.getByText("Team exclue champs persos").click();

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("button", { name: "Consultations 🧑‍⚕️" }).click();

  await page
    .getByRole("row", {
      name: "✎ Test champ perso consultation Texte Toute l'organisation Supprimer",
    })
    .getByLabel("Toute l'organisation")
    .uncheck();

  await page.getByLabel("Team exclue champs persos").uncheck();

  await page.getByRole("button", { name: "Mettre à jour" }).nth(1).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("button", { name: "Territoires" }).click();

  await page
    .getByRole("row", {
      name: "✎ Test champ perso observation Texte Toute l'organisation Supprimer",
    })
    .getByText("Toute l'organisation")
    .click();

  await page.getByText("Team exclue champs persos").click();

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.locator(".Toastify__close-button").click();

  /*

  Test the restrictions on the fields
  Test with the allowed team



  */

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page
    .getByRole("row", { name: "Test personne Team Test - 1 30 octobre 2022" })
    .getByRole("cell")
    .nth(1)
    .click();

  await page.locator('label:has-text("Test champ perso infos sociales")').click();

  await page.locator('label:has-text("Test champ perso info médicales")').click();

  await page.locator('a:has-text("Dossier Médical")').click();

  await page.getByText("Test champ perso dossier médical").click();

  await page.locator("tbody > tr > td:nth-child(5)").click();

  await page.locator('label:has-text("Test champ perso consultation")').click();

  await page
    .getByRole("button", { name: "Fermer la fenêtre de modification de la consultation" })
    .click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");

  await page.getByRole("cell", { name: "Test territoire" }).click();

  await page.getByText("Test champ perso observation: Magique").click();

  await page.locator('label:has-text("Test champ perso observation")').click();

  await page
    .locator(
      'div[role="document"]:has-text("Modifier l\'observation×Nombre de personnes non connues hommes rencontréesNombre ")'
    )
    .getByRole("button", { name: "Close" })
    .click();

  /*

  Test the restrictions on the fields
  Test with the allowed team



  */

  await changeReactSelectValue(page, "team-selector-topBar", "Team exclue champs persos");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page
    .getByRole("row", { name: "Test personne Team Test - 1 30 octobre 2022" })
    .getByRole("cell")
    .nth(1)
    .click();

  await expect(page.locator('label:has-text("Test champ perso infos sociales")')).toBeHidden();

  await expect(page.locator('label:has-text("Test champ perso info médicales")')).toBeHidden();

  await page.locator('a:has-text("Dossier Médical")').click();

  await expect(page.locator('label:has-text("Test champ perso dossier médical")')).toBeHidden();

  await page.locator("tbody > tr > td:nth-child(5)").click();

  await expect(page.locator('label:has-text("Test champ perso consultation")')).toBeHidden();

  await page
    .getByRole("button", { name: "Fermer la fenêtre de modification de la consultation" })
    .click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");

  await page.getByRole("cell", { name: "Test territoire" }).click();

  await expect(page.getByText("Test champ perso observation: Magique")).toBeHidden();
  await page.getByText("Nombre de personnes non connues hommes rencontrées:").click();

  await expect(page.locator('label:has-text("Test champ perso observation")')).toBeHidden();

  await page
    .locator(
      'div[role="document"]:has-text("Modifier l\'observation×Nombre de personnes non connues hommes rencontréesNombre ")'
    )
    .getByRole("button", { name: "Close" })
    .click();
});
