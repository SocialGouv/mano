import { test, expect } from "@playwright/test";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, loginWith } from "./utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";

dayjs.extend(utc);
dayjs.locale("fr");
test.beforeAll(async () => {
  await populate();
});

test("Création d'un rapport aujourd'hui avec plusieurs données", async ({ page }) => {
  const date = dayjs().utc().format("YYYY-MM-DD");
  await loginWith(page, "admin1@example.org");

  // Création du contexte (équipe, personne, territoire)
  await page.getByRole("link", { name: "Équipes" }).click();
  await page.getByRole("button", { name: "Créer une équipe" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("autre équipe");
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une personne" }).click();
  await page.getByLabel("Nom").fill("Toto");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("link", { name: "Territoires" }).click();
  await page.getByRole("button", { name: "Créer un territoire" }).click();
  await page.getByLabel("Nom").fill("mon territoire");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  // Démarrage du compte rendu
  await page.getByRole("link", { name: "Comptes rendus" }).click();

  // Ajout d'un passage
  await page.getByRole("button", { name: "Passer les passages en plein" }).click();
  await page.getByRole("button", { name: "Ajouter un passage" }).click();
  await page.getByLabel("Passage(s) anonyme(s) Cochez").check();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Passages enregistrés !").click();
  await page.getByText("Fermer").click();

  // Ajout d'une rencontre
  await page.getByRole("button", { name: "Passer les rencontres en" }).click();
  await page.getByRole("button", { name: "Ajouter une rencontre" }).click();
  await changeReactSelectValue(page, "person", "Toto");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByLabel("Fermer").first().click();

  // Ajout d'un service
  await page
    .locator("div")
    .filter({ hasText: /^Café-\+$/ })
    .getByLabel("plus")
    .click();

  // Ajout d'une observation
  await page.getByRole("button", { name: "Passer les observations en" }).click();
  await page.getByRole("button", { name: "Ajouter une observation" }).click();
  await page.getByLabel("Nombre de personnes non connues hommes rencontrées").fill("1");
  await changeReactSelectValue(page, "observation-select-territory", "mon territoire");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByText("Fermer").click();

  // Ajout d'une collaboration et d'une transmission
  await page.locator(`.report-select-collaboration-Team-Test---1${date}__indicator`).click();
  await page.locator(`#report-select-collaboration-Team-Test---1${date}`).fill("de");
  await page.getByText('Créer "de"').click();
  await page.getByText("Collaboration créée !").click();
  await page.getByRole("button", { name: "Ajouter une transmission" }).click();
  await page.getByPlaceholder("Entrez ici votre transmission").fill("tout va bien");
  await page.getByRole("button", { name: "Enregistrer" }).click();

  // Ajout d'une action
  await page.getByLabel("Ajouter une action").click();
  await page.getByLabel("Nom de l'action").fill("mon action");
  await changeReactSelectValue(page, "create-action-team-select", "Team Test - 1");
  await changeReactSelectValue(page, "create-action-person-select", "Toto");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  // Ajout d'une consultation
  await page.getByRole("button", { name: "Consultations (0)" }).click();
  await page.getByLabel("Ajouter une action").click();
  await changeReactSelectValue(page, "create-consultation-person-select", "Toto");
  await changeReactSelectValue(page, "create-consultation-team-select", "Team Test - 1");
  await changeReactSelectValue(page, "consultation-modal-type", "Médicale");
  await page.getByRole("button", { name: "Sauvegarder" }).click();

  // Ajout d'un commentaire de consultation
  await page.getByRole("table").getByText("Consultation Médicale").click();
  await page.locator('[data-test-id="modal"]').getByRole("button", { name: "Commentaires" }).click();
  await page.getByRole("button", { name: "＋ Ajouter un commentaire" }).click();
  await page.getByLabel("Créé le / Concerne le").click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Mon commentaire");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByText("Fermer").click();

  // Ajout d'un commentaire d'action
  await page.getByRole("button", { name: "Actions (1)" }).click();
  await page.getByRole("table").getByText("mon action").click();
  await page.locator('[data-test-id="modal"]').getByRole("button", { name: "Commentaires" }).click();
  await page.getByRole("button", { name: "＋ Ajouter un commentaire" }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Mon autre commentaire");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire ajouté !").click();
  await page.getByText("Fermer").click();

  // Début des vérifications (actions et consultations ont déjà été validés indirectement par les étapes précédentes)
  // Commentaires
  await expect(page.getByRole("button", { name: "Commentaires médicaux (1)" })).toBeVisible();
  await page.getByRole("button", { name: "Commentaires médicaux (1)" }).click();
  await expect(page.getByText("Mon commentaire").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Commentaires (1)" })).toBeVisible();
  await page.getByRole("button", { name: "Commentaires (1)" }).click();
  await expect(page.getByText("Mon autre commentaire").first()).toBeVisible();

  // Transmissions
  await expect(page.getByRole("group").getByText("tout va bien")).toBeVisible();
  await expect(page.getByRole("group").getByText("de")).toBeVisible();

  // Rencontres, passages, observations, personnes créées
  await expect(page.getByText("1rencontreRencontres (1)")).toBeVisible();
  await expect(page.getByText("1passagePassages (1)")).toBeVisible();
  await expect(page.getByText("1observation")).toBeVisible();
  await expect(page.getByText("1personne créée")).toBeVisible();

  // Service
  await expect(page.locator('[data-test-id="Team Test - 1-Café-1"]')).toBeVisible();

  // Vérification qu'on ne voit rien le jour précédent
  await page.getByRole("button", { name: "Aujourd'hui" }).click();
  await page.getByRole("button", { name: "Hier" }).click();
  await expect(page.getByText("0rencontreRencontres (0)")).toBeVisible();
  await expect(page.getByText("0passagePassages (0)")).toBeVisible();
  await expect(page.getByText("0observation")).toBeVisible();
  await expect(page.getByText("0personne créée")).toBeVisible();
  await expect(page.locator('[data-test-id="Team Test - 1-Café-0"]')).toBeVisible();
  await expect(page.getByRole("group").getByText("tout va bien")).not.toBeVisible();
  await expect(page.getByRole("group").getByText("de")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Commentaires médicaux (0)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Commentaires (0)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Actions (0)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Consultations (0)" })).toBeVisible();

  // Vérification avec une autre équipe
  await page.getByLabel("Remove Team Test -").click();
  await changeReactSelectValue(page, "report-team-select", "autre équipe");
  await page.getByRole("button", { name: "Hier" }).click();
  await page.getByRole("button", { name: "Aujourd'hui" }).click();
  await expect(page.getByText("0rencontreRencontres (0)")).toBeVisible();
  await expect(page.getByText("0passagePassages (0)")).toBeVisible();
  await expect(page.getByText("0observation")).toBeVisible();
  await expect(page.getByText("0personne créée")).toBeVisible();
  await expect(page.locator('[data-test-id="autre équipe-Café-0"]')).toBeVisible();
  await expect(page.getByRole("group").getByText("tout va bien")).not.toBeVisible();
  await expect(page.getByRole("group").getByText("de")).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Commentaires médicaux (0)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Commentaires (0)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Actions (0)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Consultations (0)" })).toBeVisible();

  // Vérification avec "toutes les équipes"
  await page.getByLabel("Comptes rendus de toute l'").check();
  await expect(page.getByText("1rencontreRencontres (1)")).toBeVisible();
  await expect(page.getByText("1passagePassages (1)")).toBeVisible();
  await expect(page.getByText("1observation")).toBeVisible();
  await expect(page.getByText("1personne créée")).toBeVisible();
  await expect(page.locator('input[data-test-id="general-Café-1"]')).toBeVisible();
  await expect(page.getByRole("group").getByText("tout va bien")).toBeVisible();
  await expect(page.getByRole("group").getByText("de")).toBeVisible();
  await expect(page.getByRole("button", { name: "Commentaires médicaux (1)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Commentaires (1)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Actions (1)" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Consultations (1)" })).toBeVisible();
});
