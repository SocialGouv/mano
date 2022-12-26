import { test, expect } from "@playwright/test";
import { populate } from "./scripts/populate-db";
import { loginWith } from "./utils";

test.beforeAll(async () => {
  await populate();
});

test("test territories", async ({ page }) => {
  // Create territory

  await loginWith(page, "admin9@example.org");

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");
  await page.getByRole("button", { name: "Créer un nouveau territoire" }).click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Le nom est obligatoire").click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("test de territoire new");
  await page.getByLabel("Périmètre").click();
  await page.getByLabel("Périmètre").fill("mon périmètre");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByText("Retour").click();

  // Create observation
  await expect(page).toHaveURL("http://localhost:8090/territory");
  await page.getByRole("cell", { name: "test de territoire new" }).click();
  await page.getByRole("button", { name: "Nouvelle observation" }).click();
  await page.getByLabel("Nombre de personnes non connues hommes rencontrées").click();
  await page.getByLabel("Nombre de personnes non connues hommes rencontrées").fill("1");
  await page.getByLabel("Nombre de personnes non connues femmes rencontrées").click();
  await page.getByLabel("Nombre de personnes non connues femmes rencontrées").fill("1");
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("HELLO COMMENTAIRE");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.locator('span:has-text("HELLO COMMENTAIRE")').click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Observation mise à jour").click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Supprimer l'observation" }).click();
  // await page.getByRole("button", { name: "Close" }).click();
  await page.getByText("Suppression réussie").click();

  // Custom field territory
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Territoires" }).click();
  await page.getByRole("button", { name: "Ajouter un champ" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("Mon nouveau champ de territoire");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mise à jour !").click();
  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8090/territory");
  await page.getByRole("cell", { name: "test de territoire new" }).click();
  await page.getByRole("button", { name: "Nouvelle observation" }).click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Nouvelle observation" }).click();
  await page.locator('[data-test-id="Mon nouveau champ de territoire"]').click();
  await page.getByLabel("Mon nouveau champ de territoire").fill("AH VOILA LE NOUVEAU");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  // Stats
  await page.getByRole("link", { name: "Statistiques" }).click();
  await expect(page).toHaveURL("http://localhost:8090/stats");
  await page.locator('a:has-text("Observations")').click();
  await page.getByText("Nombre d'observation de territoire").click();
  await expect(page.locator("data-test-id=number-observations-2")).toBeVisible();

  // Disconnect/reconnect
  await page.getByRole("button", { name: "User Admin Test - 9" }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter", exact: true }).click();
  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("admin9@example.org");
  await page.getByLabel("Email").press("Enter");
  await page.getByLabel("Mot de passe").click();
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByLabel("Clé de chiffrement d'organisation").press("Enter");
  await page.getByRole("link", { name: "Territoires" }).click();
  await page.getByRole("cell", { name: "test de territoire new" }).click();
  await page.getByText("Mon nouveau champ de territoire: AH VOILA LE NOUVEAU").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Observation mise à jour").click();
});
