import { test, expect } from "@playwright/test";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue } from "./utils";

test.beforeAll(async () => {
  await populate();
});

test("test", async ({ page }) => {
  await page.goto("http://localhost:8090/auth");
  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("admin1@example.org");
  await page.getByLabel("Email").press("Tab");
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByLabel("Mot de passe").press("Enter");
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("test");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByRole("link", { name: "Agenda" }).click();
  await page.getByRole("button", { name: "Créer une nouvelle consultation" }).click();
  await changeReactSelectValue(page, "create-consultation-person-select", "test");
  await changeReactSelectValue(page, "consultation-modal-type", "Médicale");

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Consultation Médicale").click();
  await page.getByRole("button", { name: "Annuler" }).click();
});
