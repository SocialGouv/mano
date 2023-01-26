import { test, expect } from "@playwright/test";
import { dayjsInstance } from "../dashboard/src/services/date";
import { populate } from "./scripts/populate-db";

test.beforeAll(async () => {
  await populate();
});

test("test", async ({ page }) => {
  await page.goto("http://localhost:8090/auth");
  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("admin1@example.org");
  await page.getByLabel("Email").press("Enter");
  await page.getByLabel("Mot de passe").click();
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByLabel("Clé de chiffrement d'organisation").press("Enter");
  await page.getByRole("heading", { name: "Services" }).click();
  await page.getByRole("button", { name: "Tous mes services" }).click();
  await page.locator("#Repas-add").click();
  await page.locator("#Kit-add").click();
  await page.locator('[id="Don\\ chaussures-add"]').click({ clickCount: 2 });
  await page.locator('[id="Distribution\\ seringue-add"]').click({ clickCount: 2 });
  await page.locator('[data-test-id="Don chaussures-2"]').click();
  await page.locator('[data-test-id="Distribution seringue-2"]').click();
  await page.locator('[data-test-id="Kit-1"]').click();
  await page.locator('[data-test-id="Repas-1"]').click();
  await page.locator('[data-test-id="Douche-0"]').click();
  await page.locator('[data-test-id="Café-0"]').click();

  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Accueil de jour" }).click();

  await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();
  await page
    .getByText(
      `Activer l'accueil de jour, pour pouvoir enregistrer les services proposés par votre oranisation. Un menu "Accueil" apparaîtra sur la barre de navigation latérale.`
    )
    .click();
  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.getByText("Mise à jour !").click();
  await expect(page.getByRole("link", { name: "Accueil" })).not.toBeVisible();
  await page
    .getByText(
      `Activer l'accueil de jour, pour pouvoir enregistrer les services proposés par votre oranisation. Un menu "Accueil" apparaîtra sur la barre de navigation latérale.`
    )
    .click();
  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.getByText("Mise à jour !").click();
  await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();

  await page.hover(".service-group-title");
  await page.getByRole("button", { name: "Modifier le groupe Tous mes services" }).click();
  await page.getByPlaceholder("Tous mes services").fill("Nouveau nom pour tous");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByRole("link", { name: "Accueil" }).click();
  await page.getByRole("button", { name: "Nouveau nom pour tous" }).click();
  await page.locator('[data-test-id="Repas-1"]').click();
  await page.locator('[data-test-id="Kit-1"]').click();
  await page.locator('[data-test-id="Don chaussures-2"]').click();
  await page.locator('[data-test-id="Distribution seringue-2"]').click();
  await page.locator('[data-test-id="Douche-0"]').click();
  await page.locator('[data-test-id="Café-0"]').click();
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Accueil de jour" }).click();
  await page.getByRole("button", { name: "Ajouter un groupe" }).click();
  await page.getByPlaceholder("Injection").click();
  await page.getByRole("dialog", { name: "Ajouter un groupe de services" }).getByRole("button", { name: "Ajouter" }).click();
  await page.getByText("Le titre du groupe de services est obligatoire").click();
  await page.getByPlaceholder("Injection").click();
  await page.getByPlaceholder("Injection").fill("Le deux");
  await page.getByRole("dialog", { name: "Ajouter un groupe de services" }).getByRole("button", { name: "Ajouter" }).click();
  await page.locator('div[role="alert"]:has-text("Groupe ajouté")').click();
  await page.locator("details[data-group='Le deux']").getByPlaceholder("Ajouter un service").click();
  await page.locator("details[data-group='Le deux']").getByPlaceholder("Ajouter un service").fill("essai 1");
  await page.locator("details[data-group='Le deux']").getByRole("button", { name: "Ajouter" }).click();
  await page.locator("details[data-group='Le deux']").getByRole("button", { name: "Ajouter" }).click();
  await page.getByText("Vous devez saisir un nom pour le service").click();
  await page.locator("details[data-group='Le deux']").getByPlaceholder("Ajouter un service").click();
  await page.locator("details[data-group='Le deux']").getByPlaceholder("Ajouter un service").fill("test 12ED");
  await page.locator("details[data-group='Le deux']").getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("button", { name: "Ajouter un groupe" }).click();
  await page.getByPlaceholder("Injection").fill("Trois");
  await page.getByRole("dialog", { name: "Ajouter un groupe de services" }).getByRole("button", { name: "Ajouter" }).click();
  await page.locator('div[role="alert"]:has-text("Groupe ajouté")').click();
  await page.locator("details[data-group='Trois']").getByPlaceholder("Ajouter un service").click();
  await page.locator("details[data-group='Trois']").getByPlaceholder("Ajouter un service").fill("dans le trois");
  await page.locator("details[data-group='Trois']").getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("link", { name: "Accueil" }).click();
  await page.getByRole("button", { name: "Nouveau nom pour tous" }).click();
  await page.getByText("Café").click();
  await page.getByText("Douche").click();
  await page.getByText("Repas").click();
  await page.getByText("Kit").click();
  await page.getByText("Don chaussures").click();
  await page.getByText("Distribution seringue").click();
  await page.getByRole("button", { name: "Le deux" }).click();
  await page.getByText("essai 1").click();
  await page.getByText("test 12ED").click();
  await page.getByRole("button", { name: "Trois" }).click();
  await page.getByText("dans le trois").click();
  await page.getByRole("button", { name: "Nouveau nom pour tous" }).click();
  await page.getByRole("button", { name: "Trois" }).click();
  await page.getByRole("button", { name: "plus" }).click({
    clickCount: 4,
  });
  await page.getByRole("button", { name: "Le deux" }).click();
  await page.getByRole("button", { name: "plus" }).first().click();
  await page.locator('[data-test-id="essai 1-1"]').click();
  await page.getByRole("button", { name: "Nouveau nom pour tous" }).click();
  await page.getByRole("link", { name: "Comptes rendus" }).click();
  if (await page.getByRole("button", { name: dayjsInstance().add(1, "day").format("YYYY-MM-DD") }).isVisible()) {
    await page.getByRole("button", { name: dayjsInstance().add(1, "day").format("YYYY-MM-DD") }).click();
  } else {
    await page.getByRole("button", { name: dayjsInstance().subtract(1, "day").format("YYYY-MM-DD") }).click();
  }
  await page.getByRole("navigation", { name: "Navigation dans les catégories du compte-rendu" }).getByText("Accueil").click();
  await page.locator('[id="Café-add"]').click();
  await page.locator("#Douche-add").click();
  await page.locator("#Kit-add").click();
  await page.locator('[id="Distribution\\ seringue-add"]').click();
  await page.locator('[data-test-id$="Café-1"]').click();
  await page.locator('[data-test-id$="Douche-1"]').click();
  await page.locator('[data-test-id$="Repas-0"]').click();
  await page.locator('[data-test-id$="Kit-1"]').click();
  await page.locator('[data-test-id$="Don chaussures-0"]').click();
  await page.locator('[data-test-id$="Distribution seringue-1"]').click();
  await page.getByRole("button", { name: "Le deux" }).click();
  await page.getByRole("button", { name: "plus" }).first().click({ clickCount: 2 });
  await page.locator('[data-test-id$="essai 1-2"]').click();
  await page.locator('[data-test-id$="test 12ED-0"]').click();
  await page.getByRole("button", { name: "Trois" }).click();
  await page.getByRole("button", { name: "plus" }).click({ clickCount: 3 });
  await page.locator('[data-test-id$="dans le trois-3"]').click();
  await page.getByRole("button", { name: "Le deux" }).click();
  await page.locator('[data-test-id$="essai 1-2"]').click();
  await page.getByRole("button", { name: "Nouveau nom pour tous" }).click();
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Accueil de jour" }).click();
  await page.getByText("essai 1").click({ clickCount: 3 });
  await page.locator("#service-groups").click();
});
