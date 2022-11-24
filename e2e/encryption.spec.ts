import { test, expect } from "@playwright/test";
import { populate } from "./scripts/populate-db";

test.beforeAll(async () => {
  await populate();
});

test("test", async ({ page }) => {
  await page.goto("http://localhost:8090/");
  await page.goto("http://localhost:8090/auth");

  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("admin8@example.org");
  await page.getByLabel("Mot de passe").click();
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByLabel("Mot de passe").press("Enter");
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Chiffrement" }).click();
  await page.getByRole("button", { name: "Changer la clé de chiffrement" }).click();
  await page.getByRole("textbox", { name: "Clé de chiffrement" }).click();
  await page.getByRole("textbox", { name: "Clé de chiffrement" }).fill("erreur");
  await page.getByLabel("Confirmez la clé de chiffrement").click();
  await page.getByLabel("Confirmez la clé de chiffrement").fill("raté");
  await page.locator("data-test-id=encryption-modal").getByRole("button", { name: "Changer la clé de chiffrement" }).click();
  await page.getByText("Les clés ne sont pas identiques").click();
  await page.getByRole("textbox", { name: "Clé de chiffrement" }).click();
  await page.getByRole("textbox", { name: "Clé de chiffrement" }).fill("nouvelle");
  await page.getByLabel("Confirmez la clé de chiffrement").click();
  await page.getByLabel("Confirmez la clé de chiffrement").fill("nouvelle");
  await page.locator("data-test-id=encryption-modal").getByRole("button", { name: "Changer la clé de chiffrement" }).click();
  await page.getByText("Données chiffrées ! Veuillez noter la clé puis vous reconnecter").click();
  await page.locator("data-test-id=encryption-modal").getByRole("button", { name: "Close" }).click();

  await page.getByRole("button", { name: "User Test - 8" }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter" }).click();

  await expect(page).toHaveURL("http://localhost:8090/auth");
  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("admin8@example.org");
  await page.getByLabel("Mot de passe").click();
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByLabel("Clé de chiffrement d'organisation").click();
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByText("La clé de chiffrement ne semble pas être correcte, veuillez réessayer.").click();
  await page.getByLabel("Clé de chiffrement d'organisation").click();
  await page.getByLabel("Clé de chiffrement d'organisation").fill("nouvelle");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Chiffrement" }).click();
  await page.getByRole("heading", { name: "Chiffrement" }).click();
});
