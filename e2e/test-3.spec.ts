import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:8083/");

  await page.goto("http://localhost:8083/auth");

  await page.getByLabel("Email").click();

  await page.getByLabel("Email").fill("raph@selego.co");

  await page.getByLabel("Email").press("Tab");

  await page.getByLabel("Mot de passe").fill("Coucou2&");

  await page.getByLabel("Mot de passe").press("Enter");

  await page.getByLabel("Clé de chiffrement d'organisation").click({
    clickCount: 3,
  });

  await page
    .getByLabel("Clé de chiffrement d'organisation")
    .fill("Jeu du rond");

  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.getByText("Choisir son équipe pour commencer").click();

  await page.getByRole("button", { name: "Romuald Dubois" }).click();
  await expect(page).toHaveURL("http://localhost:8083/reception?calendarTab=2");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8083/person");

  await page
    .getByRole("heading", {
      name: "Personnes suivies par l'organisation bzubzu",
    })
    .click();

  await page.getByText("Recherche :").click();

  await page
    .getByPlaceholder(
      "Par mot clé, présent dans le nom, la description, un commentaire, une action, ..."
    )
    .fill("test");
  await expect(page).toHaveURL("http://localhost:8083/person?search=test");

  await page.locator(".table-cell").first().click();
  await expect(page).toHaveURL(
    "http://localhost:8083/person/05edad14-be12-42a1-a630-5671518ead22"
  );

  await page
    .getByRole("heading", {
      name: "Dossier de test créée par -- Choisir un utilisateur --",
    })
    .click();

  await page.getByRole("link", { name: "Statistiques" }).click();
  await expect(page).toHaveURL("http://localhost:8083/stats");

  await page.locator('span:has-text("337")').first().dblclick();

  await page.locator('span:has-text("337")').nth(1).click();

  await page.locator('span:has-text("945000")').click();

  await page.getByLabel("Statistiques de toute l'organisation").check();
});
