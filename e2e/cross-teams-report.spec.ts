import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import dayjs from "dayjs";

test("test", async ({ page }) => {
  // Always use a new items
  const today = dayjs();
  const team1Name = "Team test 1";
  const team2Name = nanoid();
  const person1Name = nanoid();
  const person2Name = nanoid();
  const person1action = nanoid();
  const person2action = nanoid();
  const team1Description = nanoid();
  const team2Description = nanoid();
  const team1Collab = nanoid();
  const team2Collab = nanoid();

  await page.goto("http://localhost:8090/");

  await page.goto("http://localhost:8090/auth");

  await page.getByLabel("Email").click();

  await page.getByLabel("Email").fill("admin1@example.org");

  await page.getByLabel("Mot de passe").click();

  await page.getByLabel("Mot de passe").fill("secret");

  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");

  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

  await page.getByRole("link", { name: "Équipes" }).click();
  await expect(page).toHaveURL("http://localhost:8090/team");

  await page.getByRole("button", { name: "Créer une nouvelle équipe" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(team2Name);

  await page.getByLabel("Oui").check();

  await page.getByRole("button", { name: "Créer" }).click();
  await page.locator(".Toastify__close-button").click();
});
