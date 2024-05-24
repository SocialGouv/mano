import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith } from "./utils";
test.beforeAll(async () => {
  await populate();
});

test("Create custom fields filtered by team", async ({ page }) => {
  // Always use a new items
  const personName = nanoid();
  const territoryName = nanoid();
  const teamExcludeCustomFieldName = nanoid();
  const testPersonSocialField = nanoid();
  const testPersonMedicalField = nanoid();
  const testMedicalFileField = nanoid();
  const testConsultationField = nanoid();
  const testObsTerritoryField = nanoid();

  await loginWith(page, "admin4@example.org");

  /*

  Add a new team



  */

  await page.getByRole("link", { name: "Équipes" }).click();
  await expect(page).toHaveURL("http://localhost:8090/team");

  await page.getByRole("button", { name: "Créer une équipe" }).click();
  await page.getByRole("dialog").getByLabel("Nom").fill(teamExcludeCustomFieldName);

  await page.getByLabel("Non").check();

  await page.getByRole("dialog").getByRole("button", { name: "Créer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  /*
  Add the custom fields
  */

  await page.getByRole("link", { name: "Organisation" }).click();

  await page.getByRole("button", { name: "Personnes suivies", exact: true }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).first().click();
  await page.getByRole("dialog").getByLabel("Nom").fill(testPersonSocialField);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Ajouter un champ" }).nth(1).click();

  await page.getByRole("dialog").getByLabel("Nom").fill(testPersonMedicalField);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).click();

  await page.getByRole("dialog").getByLabel("Nom").fill(testMedicalFileField);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Consultations" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).click();

  await page.getByRole("dialog").getByLabel("Nom").fill(testConsultationField);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Territoires" }).click();

  await page.getByRole("button", { name: "Ajouter un champ" }).click();

  await page.getByRole("dialog").getByLabel("Nom").fill(testObsTerritoryField);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.locator(".Toastify__close-button").last().click();

  /*
  Check that the fields exist and update their value
  */

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une personne" }).click();
  await page.getByRole("dialog").getByLabel("Nom").fill(personName);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").last().click();
  await changeReactSelectValue(page, "team-selector-topBar", "Team Test - 4");

  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("dialog").getByText("Informations sociales").click();
  await page.getByLabel(testPersonSocialField).click();

  await page.getByRole("dialog").getByText("Informations de santé").click();
  await page.getByLabel(testPersonMedicalField).click();
  await page.getByRole("button", { name: "Annuler" }).click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await page.getByText(testMedicalFileField).click();
  await page.getByRole("button", { name: "Ajouter une consultation" }).click();
  await page.getByRole("textbox", { name: "Nom (facultatif)" }).fill("Consult");
  await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");
  await clickOnEmptyReactSelect(page, "create-consultation-team-select", "Team Test - 4");
  await page.getByLabel(testConsultationField).click();
  await page.getByLabel(testConsultationField).fill("Super");
  await page.getByRole("button", { name: "Sauvegarder" }).click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");
  await page.getByRole("button", { name: "Créer un territoire" }).click();
  await page.getByRole("dialog").getByLabel("Nom").fill(territoryName);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").last().click();

  await page.getByRole("button", { name: "Nouvelle observation" }).click();
  await page.getByLabel(testObsTerritoryField).click();
  await page.getByLabel(testObsTerritoryField).fill("Magique");
  await clickOnEmptyReactSelect(page, "observation-select-team", teamExcludeCustomFieldName);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").last().click();

  /*
  Restrict the fields to the team
  */

  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Personnes suivies", exact: true }).click();

  await page.hover(`[data-test-id='${testPersonSocialField}']`);
  await page
    .getByRole("button", {
      name: `Modifier le champ ${testPersonSocialField}`,
    })
    .click();

  await page.getByLabel("Activé pour toute l'organisation").uncheck();
  await changeReactSelectValue(page, "enabledTeams", "Team Test - 4");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mise à jour !").click();

  await page.hover(`[data-test-id='${testPersonMedicalField}']`);
  await page
    .getByRole("button", {
      name: `Modifier le champ ${testPersonMedicalField}`,
    })
    .click();

  await page.getByLabel("Activé pour toute l'organisation").uncheck();
  await changeReactSelectValue(page, "enabledTeams", "Team Test - 4");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mise à jour !").click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await page.hover(`[data-test-id='${testMedicalFileField}']`);
  await page
    .getByRole("button", {
      name: `Modifier le champ ${testMedicalFileField}`,
    })
    .click();
  await page.getByLabel("Activé pour toute l'organisation").uncheck();
  await changeReactSelectValue(page, "enabledTeams", "Team Test - 4");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mise à jour !").click();

  await page.getByRole("button", { name: "Consultations" }).click();

  await page.hover(`[data-test-id="${testConsultationField}"]`);
  await page
    .getByRole("button", {
      name: `Modifier le champ ${testConsultationField}`,
    })
    .click();
  await page.getByLabel("Activé pour toute l'organisation").uncheck();
  await changeReactSelectValue(page, "enabledTeams", "Team Test - 4");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mise à jour !").click();

  await page.getByRole("button", { name: "Territoires" }).click();

  await page.hover(`[data-test-id='${testObsTerritoryField}']`);
  await page
    .getByRole("button", {
      name: `Modifier le champ ${testObsTerritoryField}`,
    })
    .click();

  await page.getByLabel("Activé pour toute l'organisation").uncheck();
  await changeReactSelectValue(page, "enabledTeams", "Team Test - 4");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mise à jour !").click();

  /*

  Test the restrictions on the fields
  Test with the allowed team



  */

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByRole("cell", { name: personName }).click();
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("dialog").getByText("Informations sociales").click();
  await page.locator(`data-test-id=${testPersonSocialField}`).click();
  await page.getByRole("dialog").getByText("Informations de santé").click();
  await page.locator(`data-test-id=${testPersonMedicalField}`).click();
  await page.getByRole("button", { name: "Annuler" }).click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await page.getByText(testMedicalFileField).click();
  await page.getByText("Consult- Médicale").click();
  await page.locator(`data-test-id=${testConsultationField}`).click();

  await page.getByRole("button", { name: "Fermer" }).first().click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");

  await page.getByRole("cell", { name: territoryName }).click();

  await page.getByText(`${testObsTerritoryField}: Magique`).click();

  await page.locator(`data-test-id=${testObsTerritoryField}`).click();

  await page.getByRole("button", { name: "Annuler" }).click();

  /*
  Test the restrictions on the fields
  Test with the unallowed team
  */

  await changeReactSelectValue(page, "team-selector-topBar", teamExcludeCustomFieldName);

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByRole("cell", { name: personName }).click();
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("dialog").getByText("Informations sociales").click();
  await expect(page.locator(`data-test-id=${testPersonSocialField}`)).toBeHidden();
  await page.getByRole("dialog").getByText("Informations de santé").click();
  await expect(page.locator(`data-test-id=${testPersonMedicalField}`)).toBeHidden();
  await page.getByRole("button", { name: "Annuler" }).click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await expect(page.getByText(testMedicalFileField)).toBeHidden();
  await page.getByText("Consult- Médicale").click();
  await expect(page.locator(`data-test-id=${testConsultationField}`)).toBeHidden();
  await page.getByRole("button", { name: "Fermer" }).first().click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");

  await page.getByRole("cell", { name: territoryName }).click();

  await expect(page.getByText("Test champ perso observation: Magique")).toBeHidden();

  await expect(page.locator(`data-test-id=${testObsTerritoryField}`)).toBeHidden();
});
