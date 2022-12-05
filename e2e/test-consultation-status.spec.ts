import { test, expect } from "@playwright/test";
import { dayjsInstance } from "../dashboard/src/services/date";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue } from "./utils";

test.beforeAll(async () => {
  await populate();
});

test("test", async ({ page }) => {
  await page.goto("http://localhost:8090/auth");
  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("admin3@example.org");
  await page.getByLabel("Email").press("Enter");
  await page.getByLabel("Mot de passe").click();
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByLabel("Clé de chiffrement d'organisation").click();
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("personne consultation");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await page.getByRole("button", { name: "🩺 Ajouter une consultation" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("A faire demain");
  await page.locator('#type div:has-text("Choisissez le type de consultation")').nth(1).click();
  await page.locator("#react-select-type-option-0").click();
  await page.getByLabel("Échéance / À faire le").click({
    clickCount: 3,
  });
  await page.getByLabel("Échéance / À faire le").fill(dayjsInstance().add(1, "day").format("DD/MM/YYYY"));
  await page.getByLabel("Échéance / À faire le").press("Enter");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByRole("cell", { name: "A faire demain Médicale" }).click();
  await page.getByLabel("Nom").click();
  await page.locator("html").click();
  await page.getByLabel("Nom").click({
    clickCount: 3,
  });
  await page.getByLabel("Nom").fill("faite aujourd'hui");
  await page.locator(".new-consultation-select-status__value-container").click();
  await page.locator("#react-select-7-option-1").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByRole("cell", { name: dayjsInstance().add(1, "day").format("dddd D MMMM") }).click();
  await changeReactSelectValue(page, "new-consultation-select-status", "ANNULÉE");
  await page.getByLabel("Nom").click({
    clickCount: 3,
  });
  await page.getByLabel("Nom").fill("Annulée");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator('span:has-text("' + dayjsInstance().add(1, "day").format("D") + '")').click();
  await page.getByRole("button", { name: "Fermer la fenêtre de modification de la consultation" }).click();
  await page.getByRole("button", { name: "🩺 Ajouter une consultation" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("Directement faite");
  await page.getByText("Choisissez le type de consultation").click();
  await page.locator("#react-select-type-option-0").click();
  await page.getByText("À FAIRE").first().click();
  await page.locator("#react-select-10-option-1").click();
  await page.getByText("Faite le").click();
  await page.getByLabel("Faite le").dblclick();
  await page.getByLabel("Faite le").click({
    clickCount: 3,
  });
  await page.getByLabel("Faite le").fill(dayjsInstance().subtract(1, "day").format("DD/MM/YYYY"));
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByRole("cell", { name: dayjsInstance().subtract(1, "day").format("dddd D MMMM") }).click();
  await page.getByLabel("Description").click();
  await page.getByLabel("Description").fill("youpi");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByRole("cell", { name: "FAIT" }).click();
  await page.getByLabel("Description").click();
  await page.getByLabel("Description").fill("youpi super");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByRole("button", { name: "User Admin Test - 3" }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter et supprimer toute trace de mon passage" }).click();
  await page.getByText("Vous êtes déconnecté(e)").click();
  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("admin3@example.org");
  await page.getByLabel("Email").press("Tab");
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByLabel("Mot de passe").press("Enter");
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByLabel("Clé de chiffrement d'organisation").press("Enter");
  await page.getByRole("link", { name: "Agenda" }).click();
  await page.locator(".action-select-status-filter__indicator").first().click();
  await page.getByRole("cell", { name: "Annulée Médicale" }).click();
  await page.getByRole("button", { name: "Fermer la fenêtre de modification de la consultation" }).click();
  await page.getByRole("link", { name: "Agenda" }).click();
  await page.getByText("Hier (0)").click();
  await page.locator(".action-select-status-filter__indicator").first().click();
  await page.getByText("Directement faite").click();
  await page.getByRole("button", { name: "Fermer la fenêtre de modification de la consultation" }).click();
});
