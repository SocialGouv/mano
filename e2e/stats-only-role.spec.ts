import { test, expect } from "@playwright/test";
import { populate } from "./scripts/populate-db";
import { loginWith, logOut } from "./utils";

test.beforeAll(async () => {
  await populate();
});

test("test", async ({ page }) => {
  await loginWith(page, "stats-only8@example.org");

  // menu navigation non visible pour stats-only
  await expect(page.getByRole("link", { name: "Statistiques" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Utilisateurs" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Équipes" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Organisation" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Soliguide" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Structures" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Comptes rendus" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Personnes suivies" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Territoires" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Agenda" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Accueil" })).not.toBeVisible();

  await expect(page.getByRole("list").getByText("Général")).toBeVisible();
  await expect(page.getByRole("list").getByText("Services")).toBeVisible();
  await expect(page.getByRole("list").getByText("Actions")).toBeVisible();
  await expect(page.getByRole("list").getByText("Personnes créées", { exact: true })).toBeVisible();
  await expect(page.getByRole("list").getByText("Personnes suivies", { exact: true })).toBeVisible();
  await expect(page.getByRole("list").getByText("Passages")).toBeVisible();
  await expect(page.getByRole("list").getByText("Rencontres")).toBeVisible();
  await expect(page.getByRole("list").getByText("Observations")).toBeVisible();
  await expect(page.getByRole("list").getByText("Comptes-rendus")).toBeVisible();
  await expect(page.getByRole("list").getByText("Consultations")).toBeVisible();
  await expect(page.getByRole("list").getByText("Dossiers médicaux des personnes suivies", { exact: true })).toBeVisible();
  await expect(page.getByRole("list").getByText("Dossiers médicaux des personnes créées", { exact: true })).toBeVisible();

  await logOut(page, "User Stats Only Test - 8");
});
