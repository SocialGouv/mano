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

test("Replace me", async ({ page }) => {
  // Pas besoin d'appeler l'API adresse.
  await page.route("*/**/communes?*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { codeDepartement: "44", centre: { type: "Point", coordinates: [-1.5573, 47.1733] }, nom: "Rezé", code: "44143", _score: 1.2718640935284935 },
        {
          codeDepartement: "15",
          centre: { type: "Point", coordinates: [3.1066, 45.1333] },
          nom: "Rézentières",
          code: "15161",
          _score: 0.45756001815706887,
        },
      ]),
    });
  });
  await page.goto("http://localhost:8090/auth");
  await page.getByLabel("Email").fill("superadmin@example.org");
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByRole("button", { name: "Se connecter" }).click();

  // Création d'une organisation
  await page.getByRole("button", { name: "Créer une nouvelle" }).click();
  await page.getByLabel("Nom", { exact: true }).fill("Orga Test - Nouvelle Orga");
  await page.getByLabel("Identifiant interne (non").click();
  await page.getByLabel("Identifiant interne (non").fill("identifiant orga");
  await page.locator(".organisation-create-city__input-container").click();
  await page.getByLabel("Ville").fill("Rezé");
  await page.getByText("Rezé (44)", { exact: true }).click();
  await changeReactSelectValue(page, "organisation-responsible", "Guillaume");
  await page.getByLabel("Nom de l’administrateur").fill("raph");
  await page.getByLabel("Email de l’administrateur").fill("admin-raph@example.org");
  await page.locator('[data-test-id="modal"]').getByRole("button", { name: "Créer" }).click();
  await page.getByText("Création réussie !").click();

  // Création d'un deuxième utilisateur
  await page.getByTestId("Ajouter utilisateur Orga Test - Nouvelle Orga").click();
  await page.getByLabel("Nom").fill("le deuxième");
  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("deuxieme@example.org");
  await changeReactSelectValue(page, "role", "Statistiques seulement");
  await page.getByLabel("Professionnel·le de santé").check();
  await page.locator('[data-test-id="modal"]').getByRole("button", { name: "Créer" }).click();
  await page.getByText("Création réussie !").click();

  // Vérifier la création des utilisateurs
  await page.getByTestId("Voir les utilisateurs Orga Test - Nouvelle Orga").click();
  await expect(page.getByRole("cell", { name: "admin-raph@example.org" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "deuxieme@example.org" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "admin", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "stats-only" })).toBeVisible();

  // Supprimer un utilisateur
  await page.getByTitle("Voulez-vous vraiment supprimer l'utilisateur le deuxième").click();
  await page.getByPlaceholder("deuxieme@example.org").fill("deuxieme@example.org");
  await page.locator('[data-test-id="button-delete-deuxieme\\@example\\.org"]').click();
  await page.getByText("Suppression réussie").click();
  await page.getByText("Fermer").click();

  // Modifier une organisation
  await page.getByTestId("Modifier l'organisation Orga Test - Nouvelle Orga").click();
  await page.getByLabel("Identifiant interne").fill("identifiant orga changé");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Organisation mise à jour").click();
});
