import { test, expect, Page } from "@playwright/test";
import { populate } from "./scripts/populate-db";
import { clickOnEmptyReactSelect, loginWith } from "./utils";

test.beforeAll(async () => {
  await populate();
});

const addCustomField = async (page: Page, name: string, type: string, options: string[]) => {
  await page.getByRole("dialog").getByLabel("Nom").fill(name);
  await clickOnEmptyReactSelect(page, "type", type);
  await page.locator(".options__input-container").click();
  for (const option of options) {
    await page.getByLabel("Choix", { exact: true }).fill(option);
    await page.keyboard.press("Enter");
  }
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mise à jour !").click();
};

test("test", async ({ page }) => {
  await loginWith(page, "admin1@example.org");

  await test.step("create fields", async () => {
    await page.getByRole("link", { name: "Organisation" }).click();

    await page.getByRole("button", { name: "Personnes suivies", exact: true }).click();
    /* personnes infos sociales */
    await page.getByRole("button", { name: "Ajouter un champ" }).nth(0).click();
    await addCustomField(page, "Contrat de travail", "Choix dans une liste", ["CDI merde je me suis trompé", "CDD", "Interim"]);
    /* personnes infos médicales */
    await page.getByRole("button", { name: "Ajouter un champ" }).nth(1).click();
    await addCustomField(page, "Drogues à fumer", "Choix multiple dans une liste", ["Pétard merde je me suis trompé", "Crack", "Pipe à crack"]);

    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await page.getByRole("button", { name: "Ajouter un champ" }).click();
    await addCustomField(page, "Douleur", "Choix multiple dans une liste", ["Colonne vertébrale merde je me suis trompé", "Bras", "Jambe"]);

    await page.getByRole("button", { name: "Consultations" }).click();
    await page.getByRole("button", { name: "Ajouter un type de consultations" }).click();
    await page.getByPlaceholder("Titre du groupe").fill("Infirmier");
    await page.getByRole("dialog", { name: "Ajouter un groupe" }).getByRole("button", { name: "Ajouter" }).click();
    await page.getByText("Type de consultation ajouté").click();
    await page.getByRole("button", { name: "Ajouter un champ" }).first().click();
    await addCustomField(page, "Poils au nez", "Choix dans une liste", ["un peu", "Beaucoup", "Passionnément"]);

    await page.getByRole("button", { name: "Ajouter un champ" }).nth(1).click();
    await addCustomField(page, "Pansements", "Choix multiple dans une liste", ["Gros", "Très gros", "Très très gros"]);

    await page.getByRole("button", { name: "Territoires" }).click();
    await page.getByRole("button", { name: "Ajouter un champ" }).click();
    await addCustomField(page, "Policiers", "Choix dans une liste", ["beaucoup", "Très beaucoup", "Très très beaucoup"]);
  });

  await test.step("create person", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("button", { name: "Créer une personne" }).click();
    await page.getByRole("dialog").getByLabel("Nom").fill("personne1");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
    await page.getByRole("button", { name: "Modifier" }).click();

    await page.getByText("+").first().click();
    await clickOnEmptyReactSelect(page, "person-custom-select-contrat-de-travail", "CDI merde je me suis trompé");

    await page.getByText("+").click();
    await clickOnEmptyReactSelect(page, "person-custom-select-drogues-à-fumer", "Pétard merde je me suis trompé");
    await clickOnEmptyReactSelect(page, "person-custom-select-drogues-à-fumer", "Crack");

    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Mis à jour !").click();

    await expect(page.getByText("CDI merde je me suis trompé")).toBeVisible();
    await expect(page.getByText("Pétard merde je me suis trompé")).toBeVisible();
    await expect(page.getByText("Crack")).toBeVisible();

    await page.getByRole("button", { name: "Sortie de file active" }).click();
    await clickOnEmptyReactSelect(page, "person-select-outOfActiveListReasons", "Relai vers autre structure");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("personne1 est hors de la file active").click();

    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await page.getByRole("button", { name: "Éditer les dossier médical" }).click();
    await clickOnEmptyReactSelect(page, "person-custom-select-douleur", "Colonne vertébrale merde je me suis trompé");
    await clickOnEmptyReactSelect(page, "person-custom-select-douleur", "Jambe");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Mis à jour !").click();

    await expect(page.getByText("Colonne vertébrale merde je me suis trompé")).toBeVisible();
    await expect(page.getByText("Jambe")).toBeVisible();

    await page.getByRole("button", { name: "Ajouter une consultation" }).click();
    await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");
    await clickOnEmptyReactSelect(page, "person-custom-select-poils-au-nez", "un peu");
    await page.getByRole("button", { name: "Sauvegarder" }).click();

    await page.getByRole("button", { name: "Ajouter une consultation" }).click();
    await clickOnEmptyReactSelect(page, "consultation-modal-type", "Infirmier");
    await clickOnEmptyReactSelect(page, "person-custom-select-pansements", "Gros");
    await clickOnEmptyReactSelect(page, "person-custom-select-pansements", "Très gros");
    await clickOnEmptyReactSelect(page, "person-custom-select-pansements", "Très très gros");
    await page.getByRole("button", { name: "Sauvegarder" }).click();

    await page.getByText("Consultation Médicale").click();
    await page.getByText("Poils au nezun peu").click();
    await page.getByRole("button", { name: "Fermer" }).first().click();
    await page.getByText("Consultation Infirmier").click();
    await page.getByText("PansementsGrosTrès grosTrès très gros").click();
    await page.getByRole("button", { name: "Fermer" }).first().click();
  });

  await test.step("create observation", async () => {
    await page.getByRole("link", { name: "Territoires" }).click();
    await expect(page).toHaveURL("http://localhost:8090/territory");
    await page.getByRole("button", { name: "Créer un territoire" }).click();
    await page.getByRole("dialog").getByLabel("Nom").fill("territoire1");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await page.getByRole("button", { name: "Nouvelle observation" }).click();
    await clickOnEmptyReactSelect(page, "observation-custom-select-policiers", "beaucoup");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await page.getByRole("button", { name: "Nouvelle observation" }).click();
    await clickOnEmptyReactSelect(page, "observation-custom-select-policiers", "Très beaucoup");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await page.getByRole("button", { name: "Nouvelle observation" }).click();
    await clickOnEmptyReactSelect(page, "observation-custom-select-policiers", "Très très beaucoup");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await expect(page.getByText("Policiers: Très très beaucoup")).toBeVisible();
    await expect(page.getByText("Policiers: Très beaucoup")).toBeVisible();
    await expect(page.getByText("Policiers: beaucoup")).toBeVisible();
  });

  await test.step("change choices value", async () => {
    await page.getByRole("link", { name: "Organisation" }).click();

    await page.getByRole("button", { name: "Personnes suivies", exact: true }).click();

    await page.locator('[data-test-id="Motif\\(s\\) de sortie de file active"]').getByRole("button", { name: "Modifier le champ" }).click();
    await page.getByRole("button", { name: "Modifier le choix Relai vers autre structure" }).click();
    await page.getByPlaceholder("Relai vers autre structure").fill("Relai chez moi");
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        `Voulez-vous vraiment renommer "Relai vers autre structure" en "Relai chez moi", et mettre à jour tous les éléments qui ont actuellement "Relai vers autre structure" en "Relai chez moi" ? Cette opération est irréversible.`
      );
      dialog.accept();
    });
    await page.getByRole("dialog", { name: "Éditer le choix: Relai vers autre structure" }).getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Choix mis à jour !").click();

    await page.hover('[data-test-id="Contrat de travail"]');
    await page
      .getByRole("button", {
        name: "Modifier le champ Contrat de travail",
      })
      .click();
    await page.getByRole("button", { name: "Modifier le choix CDI merde je me suis trompé" }).click();
    await page.getByPlaceholder("CDI merde je me suis trompé").fill("CDI seulement");
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        `Voulez-vous vraiment renommer "CDI merde je me suis trompé" en "CDI seulement", et mettre à jour tous les éléments qui ont actuellement "CDI merde je me suis trompé" en "CDI seulement" ? Cette opération est irréversible.`
      );
      dialog.accept();
    });
    await page.getByRole("dialog", { name: "Éditer le choix: CDI merde je me suis trompé" }).getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Choix mis à jour !").click();

    await page.hover('[data-test-id="Drogues à fumer"]');
    await page
      .getByRole("button", {
        name: "Modifier le champ Drogues à fumer",
      })
      .click();
    await page.getByRole("button", { name: "Modifier le choix Pétard merde je me suis trompé" }).click();
    await page.getByPlaceholder("Pétard merde je me suis trompé").fill("Pétard seulement");
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        `Voulez-vous vraiment renommer "Pétard merde je me suis trompé" en "Pétard seulement", et mettre à jour tous les éléments qui ont actuellement "Pétard merde je me suis trompé" en "Pétard seulement" ? Cette opération est irréversible.`
      );
      dialog.accept();
    });
    await page.getByRole("dialog", { name: "Éditer le choix: Pétard merde je me suis trompé" }).getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Choix mis à jour !").click();

    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await page.hover('[data-test-id="Douleur"]');
    await page
      .getByRole("button", {
        name: "Modifier le champ Douleur",
      })
      .click();
    await page.getByRole("button", { name: "Modifier le choix Colonne vertébrale merde je me suis trompé" }).click();
    await page.getByPlaceholder("Colonne vertébrale merde je me suis trompé").fill("Colonne vertébrale seulement");
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        `Voulez-vous vraiment renommer "Colonne vertébrale merde je me suis trompé" en "Colonne vertébrale seulement", et mettre à jour tous les éléments qui ont actuellement "Colonne vertébrale merde je me suis trompé" en "Colonne vertébrale seulement" ? Cette opération est irréversible.`
      );
      dialog.accept();
    });
    await page
      .getByRole("dialog", { name: "Éditer le choix: Colonne vertébrale merde je me suis trompé" })
      .getByRole("button", { name: "Enregistrer" })
      .click();
    await page.getByText("Choix mis à jour !").click();

    await page.getByRole("button", { name: "Consultations" }).click();
    await page.hover('[data-test-id="Poils au nez"]');
    await page
      .getByRole("button", {
        name: "Modifier le champ Poils au nez",
      })
      .click();
    await page.getByRole("button", { name: "Modifier le choix un peu" }).click();
    await page.getByPlaceholder("un peu").fill("Un peu");
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        `Voulez-vous vraiment renommer "un peu" en "Un peu", et mettre à jour tous les éléments qui ont actuellement "un peu" en "Un peu" ? Cette opération est irréversible.`
      );
      dialog.accept();
    });
    await page.getByRole("dialog", { name: "Éditer le choix: un peu" }).getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Choix mis à jour !").click();

    await page.hover('[data-test-id="Pansements"]');
    await page
      .getByRole("button", {
        name: "Modifier le champ Pansements",
      })
      .click();
    await page.getByRole("button", { name: "Modifier le choix Gros" }).click();
    await page.getByPlaceholder("Gros").fill("Petit");
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        `Voulez-vous vraiment renommer "Gros" en "Petit", et mettre à jour tous les éléments qui ont actuellement "Gros" en "Petit" ? Cette opération est irréversible.`
      );
      dialog.accept();
    });
    await page.getByRole("dialog", { name: "Éditer le choix: Gros" }).getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Choix mis à jour !").click();

    await page.getByRole("button", { name: "Territoires" }).click();

    await page.hover('[data-test-id="Policiers"]');
    await page
      .getByRole("button", {
        name: "Modifier le champ Policiers",
      })
      .click();
    await page.getByRole("button", { name: "Modifier le choix Très beaucoup" }).click();
    await page.getByPlaceholder("Très beaucoup").fill("Plein");
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(
        `Voulez-vous vraiment renommer "Très beaucoup" en "Plein", et mettre à jour tous les éléments qui ont actuellement "Très beaucoup" en "Plein" ? Cette opération est irréversible.`
      );
      dialog.accept();
    });
    await page.getByRole("dialog", { name: "Éditer le choix: Très beaucoup" }).getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Choix mis à jour !").click();
  });

  await test.step("expect changes to work", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByText("personne1").click();

    await expect(page.getByText("Pétard seulement")).toBeVisible();
    await expect(page.getByText("CDI seulement")).toBeVisible();
    await expect(page.getByText("Relai chez moi")).toBeVisible();

    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await expect(page.getByText("Colonne vertébrale seulement")).toBeVisible();

    await page.getByText("Consultation Médicale").click();
    await page.getByText("Poils au nezun peu").click();
    await page.getByRole("button", { name: "Fermer" }).first().click();

    await page.getByText("Consultation Infirmier").click();
    await page.getByText("PansementsPetitTrès grosTrès très gros").click();
    await page.getByRole("button", { name: "Fermer" }).first().click();

    await page.getByRole("link", { name: "Territoires" }).click();
    await page.getByRole("cell", { name: "territoire1" }).click();

    await expect(page.getByText("Policiers: Plein")).toBeVisible();
  });
});
