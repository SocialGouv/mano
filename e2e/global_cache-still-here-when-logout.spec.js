import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith } from "./utils";
import { populate } from "./scripts/populate-db";

dayjs.extend(utc);
dayjs.locale("fr");

test.beforeAll(async () => {
  await populate();
});

test("Person creation", async ({ page }) => {
  // Always use a new items
  const person1Name = nanoid();
  const person2Name = nanoid();

  await loginWith(page, "admin5@example.org");

  await test.step("Create person through Personnes Suivies page", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();

    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

    await page.getByLabel("Nom").click();

    await page.getByLabel("Nom").fill(person1Name);

    await page.getByRole("button", { name: "Sauvegarder" }).click();

    await page.getByText("Création réussie !").click();
  });

  await test.step("Create person through Accueil page", async () => {
    await page.getByRole("link", { name: "Accueil" }).click();

    await page.locator(".person-select-and-create-reception__value-container").click();

    await page.locator("#person-select-and-create-reception").fill(person2Name);

    await page.getByText(`Créer "${person2Name}"`).click();

    await page.getByText("Nouvelle personne ajoutée !").click();
  });

  await test.step("Persons created should appear in report", async () => {
    await page.getByRole("link", { name: "Comptes rendus" }).click();

    await expect(page.locator(`data-test-id=report-dot-${dayjs().format("YYYY-MM-DD")}`)).toBeVisible();
    await page.getByRole("button", { name: dayjs().format("YYYY-MM-DD") }).click();

    await page.getByText("Personnes créées (2)").click();
    await expect(page.locator(`data-test-id=${person1Name}`)).toBeVisible();
    await expect(page.locator(`data-test-id=${person1Name}`).getByRole("cell", { name: "User Admin Test - 5" })).toBeVisible();
    await expect(page.locator(`data-test-id=${person1Name}`).getByRole("cell", { name: "Team Test - 5" })).toBeVisible();
    await expect(page.locator(`data-test-id=${person2Name}`)).toBeVisible();
    await expect(page.locator(`data-test-id=${person2Name}`).getByRole("cell", { name: "User Admin Test - 5" })).toBeVisible();
    await expect(page.locator(`data-test-id=${person2Name}`).getByRole("cell", { name: "Team Test - 5" })).toBeVisible();
  });

  await page.getByRole("button", { name: "User Admin Test - 5" }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter", exact: true }).click();
  await expect(page).toHaveURL("http://localhost:8090/auth");

  await page.getByLabel("Email").fill("admin5@example.org");
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await expect(page.getByRole("cell", { name: person1Name })).toBeVisible();

  await page.getByRole("button", { name: "User Admin Test - 5" }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter et vider le cache" }).click();
  await expect(page).toHaveURL("http://localhost:8090/auth");

  await page.getByLabel("Email").fill("admin5@example.org");
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await expect(page.getByRole("cell", { name: person1Name })).toBeVisible();

  await page.goto("http://localhost:8090/auth");

  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await expect(page.getByRole("cell", { name: person1Name })).toBeVisible();
});
