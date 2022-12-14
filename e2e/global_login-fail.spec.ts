import { test, expect } from "@playwright/test";
import { populate } from "./scripts/populate-db";

test.beforeAll(async () => {
  await populate();
});

test("Try to login and fail", async ({ page }) => {
  await page.goto("http://localhost:8090/");
  await page.goto("http://localhost:8090/auth");

  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("fake@example.org");
  await page.getByLabel("Email").press("Enter");
  await page.getByText("Ce champ est obligatoire").click();

  await page.getByLabel("Mot de passe").click();
  await page.getByLabel("Mot de passe").fill("fake");

  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByText("E-mail ou mot de passe incorrect").click();
  await page.getByLabel("Mot de passe").click();
  await page.getByLabel("Mot de passe").fill("");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.getByLabel("Email").click();
  await page.getByLabel("Email").dblclick();
  await page.getByLabel("Email").fill("");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByText("Adresse email invalide").click();

  await page.getByRole("link", { name: "Mot de passe oublié ?" }).click();
  await expect(page).toHaveURL("http://localhost:8090/auth/forgot");

  await page.getByText("Réinitialiser le mot de passe").click();

  await page.getByRole("button", { name: "Envoyez un lien" }).click();
  await page.getByText("Invalid email address").click();

  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("test@example.org");

  await page.getByRole("button", { name: "Envoyez un lien" }).click();
  await page.getByRole("alert").getByText("Envoyé").click();
});
