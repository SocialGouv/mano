import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { populate } from "./scripts/populate-db";

dayjs.extend(utc);
dayjs.locale("fr");

test.beforeAll(async () => {
  await populate();
});

test("Cross teams report", async ({ page }) => {
  // Always use a new items
  const person1Name = nanoid();
  const person2Name = nanoid();

  await test.step("Log in", async () => {
    await page.goto("http://localhost:8090/");

    await page.goto("http://localhost:8090/auth");

    await page.getByLabel("Email").click();

    await page.getByLabel("Email").fill("admin5@example.org");

    await page.getByLabel("Mot de passe").click();

    await page.getByLabel("Mot de passe").fill("secret");

    await page.getByRole("button", { name: "Se connecter" }).click();

    await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");

    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");
  });

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

    await page.getByText("Entrez un nom, une date de naissance…").click();

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
    await expect(page.locator(`data-test-id=${person1Name}`).getByRole("cell", { name: "User Test - 5" })).toBeVisible();
    await expect(page.locator(`data-test-id=${person1Name}`).getByRole("cell", { name: "Team Test - 5" })).toBeVisible();
    await expect(page.locator(`data-test-id=${person2Name}`)).toBeVisible();
    await expect(page.locator(`data-test-id=${person2Name}`).getByRole("cell", { name: "User Test - 5" })).toBeVisible();
    await expect(page.locator(`data-test-id=${person2Name}`).getByRole("cell", { name: "Team Test - 5" })).toBeVisible();
  });
});
