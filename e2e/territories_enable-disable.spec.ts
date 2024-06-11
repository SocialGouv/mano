import { test, expect } from "@playwright/test";
import { populate } from "./scripts/populate-db";
import { loginWith } from "./utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";

dayjs.extend(utc);
dayjs.locale("fr");
test.beforeAll(async () => {
  await populate();
});

test("Territories - enable - disable", async ({ page }) => {
  await loginWith(page, "admin1@example.org");

  await test.step("Territories are enabled by default", async () => {
    await expect(page.getByRole("link", { name: "Territoires" })).toBeVisible();
    await page.getByRole("link", { name: "Territoires" }).click();

    await page.getByRole("link", { name: "Comptes rendus" }).click();
    await expect(page.getByTitle("Observations", { exact: true }).getByText("0")).toBeVisible();

    await page.getByRole("link", { name: "Statistiques" }).click();
    await expect(page.getByRole("button", { name: "Observations" })).toBeVisible();
    await page.getByRole("button", { name: "Observations" }).click();
  });

  await test.step("Disable territories", async () => {
    await page.getByRole("link", { name: "Organisation" }).click();
    await page.getByRole("button", { name: "Territoires", exact: true }).click();

    await page
      .getByLabel(
        `Activer les territoires, pour pouvoir enregistrer des observations liées à ces territoires. Un menu "Territoires" apparaîtra sur la barre de navigation latérale, et sur l'application mobile.`
      )
      .uncheck();

    await page.getByRole("button", { name: "Mettre à jour" }).first().click();
    await page.getByText("Mise à jour !").click();

    await expect(page.getByRole("link", { name: "Territoires" })).not.toBeVisible();

    await page.getByRole("link", { name: "Statistiques" }).click();
    await expect(page.getByRole("button", { name: "Observations", exact: true })).not.toBeVisible();

    await page.getByRole("link", { name: "Comptes rendus" }).click();
    await expect(page.getByTitle("Observations", { exact: true }).getByText("0")).not.toBeVisible();
  });

  await test.step("Enable territories", async () => {
    await page.getByRole("link", { name: "Organisation" }).click();
    await page.getByRole("button", { name: "Territoires", exact: true }).click();

    await page
      .getByLabel(
        `Activer les territoires, pour pouvoir enregistrer des observations liées à ces territoires. Un menu "Territoires" apparaîtra sur la barre de navigation latérale, et sur l'application mobile.`
      )
      .check();

    await page.getByRole("button", { name: "Mettre à jour" }).first().click();
    await page.getByText("Mise à jour !").click();

    await expect(page.getByRole("link", { name: "Territoires" })).toBeVisible();
    await page.getByRole("link", { name: "Territoires" }).click();

    await page.getByRole("link", { name: "Statistiques" }).click();
    await expect(page.getByRole("button", { name: "Observations", exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Observations", exact: true }).first().click();
    await expect(page.getByText("Nombre d'observations de territoire ?")).toBeVisible();

    await page.getByRole("link", { name: "Comptes rendus" }).click();
    await expect(page.getByTitle("Observations", { exact: true }).getByText("0")).toBeVisible();
  });
});
