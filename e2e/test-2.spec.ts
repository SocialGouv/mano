import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  await page.goto("http://localhost:8083/");

  await page.goto("http://localhost:8083/auth");

  await page.getByLabel("Email").click();

  await page.getByLabel("Email").fill("raph@selego.co");

  await page.getByLabel("Email").press("Enter");

  await page.getByLabel("Email").press("Tab");

  await page.getByText("Ce champ est obligatoire").click();

  await page.getByLabel("Mot de passe").click();

  await page.getByLabel("Mot de passe").fill("Coucou2&");

  await page.getByRole("button", { name: "Se connecter" }).click();

  await page
    .locator(
      'div:has-text("Bienvenue !Email Mot de passeMot de passe oublié ?Clé de chiffrement d\'organisat")'
    )
    .nth(1)
    .click();

  await page.getByLabel("Clé de chiffrement d'organisation").click({
    clickCount: 3,
  });

  await page
    .getByLabel("Clé de chiffrement d'organisation")
    .fill("Jeu du rond");

  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.getByRole("button", { name: "Romuald Dubois" }).click();
  await expect(page).toHaveURL("http://localhost:8083/reception?calendarTab=2");

  await page.getByRole("link", { name: "Agenda" }).click();
  await expect(page).toHaveURL("http://localhost:8083/action?calendarTab=2");

  await page.getByText("Agenda de l'équipe Romuald Dubois").click();

  await page
    .locator(
      ".col-md-6 > div > .css-2b097c-container > .css-yk16xz-control > .css-g1d714-ValueContainer"
    )
    .click();

  await page.locator("#react-select-5-option-1").click();

  await page
    .locator(".css-bxjs8u-control > .css-g1d714-ValueContainer")
    .click();

  await page.locator("#react-select-5-option-2").click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8083/person");

  await page
    .getByRole("button", { name: "Créer une nouvelle personne" })
    .click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("test");

  await page.getByRole("button", { name: "Sauvegarder" }).click();

  await page.getByText("Une personne existe déjà à ce nom").click();

  await page.waitForTimeout(5000);

  await page.getByRole("button", { name: "Close" }).click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await expect(page).toHaveURL("http://localhost:8083/territory");

  await page
    .getByPlaceholder("Par mot clé, présent dans le nom, une observation, ...")
    .click();

  await page
    .getByPlaceholder("Par mot clé, présent dans le nom, une observation, ...")
    .fill("test");
  await expect(page).toHaveURL("http://localhost:8083/territory?search=test");

  await page
    .getByText("RafraichirLoading...Créer un nouveau territoire")
    .click();

  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await expect(page).toHaveURL("http://localhost:8083/report");

  await page.getByRole("link", { name: "Lieux fréquentés" }).click();
  await expect(page).toHaveURL("http://localhost:8083/place");

  await page.getByRole("link", { name: "Structures" }).click();
  await expect(page).toHaveURL("http://localhost:8083/structure");

  await page.getByRole("cell", { name: "Georges Brun" }).click();
  await expect(page).toHaveURL(
    "http://localhost:8083/structure/0148c5e7-6826-4648-a2fc-07c40a533d10"
  );

  await page.locator('#root div:has-text("Nom")').nth(3).click();

  await page.getByLabel("Nom").click();

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await expect(page).toHaveURL("http://localhost:8083/structure");

  await page.getByText("Structure modifiée avec succès").click();

  await page.getByRole("link", { name: "Statistiques" }).click();
  await expect(page).toHaveURL("http://localhost:8083/stats");

  await page.locator('span:has-text("337")').first().click();

  await page.locator('span:has-text("337")').nth(1).click();

  await page.locator('span:has-text("945")').click();
});
