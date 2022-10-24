import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:8090/");

  await page.goto("http://localhost:8090/auth");

  await page.getByLabel("Email").click();

  await page.getByLabel("Email").fill("raph@selego.co");

  await page.getByLabel("Email").press("Enter");

  await page.getByLabel("Email").press("Tab");

  await page.getByText("Ce champ est obligatoire").click();

  await page.getByLabel("Mot de passe").click();
});
