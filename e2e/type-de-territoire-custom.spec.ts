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

test("Type de territoire personnalisé", async ({ page }) => {
  await loginWith(page, "admin1@example.org");
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Territoires", exact: true }).click();
  await page.getByPlaceholder("Ajouter un type").fill("Incubateur");
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await page.getByText("Type de territoire ajouté.").click();
  await page.getByRole("link", { name: "Territoires" }).click();
  await page.getByRole("button", { name: "Créer un territoire" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("Territoire");
  await page.locator(".territory-select-types__input-container").click();
  await page.getByLabel("Types").fill("incuba");
  await page.getByText("Incubateur", { exact: true }).click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Territoires", exact: true }).click();
  await page.hover(`id=Incubateur`);
  await page.getByLabel("Modifier le type de territoire Incubateur").click();
  await page.getByPlaceholder("Incubateur").fill("Startup palace");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Type de territoires mis à").click();
  await page.getByRole("link", { name: "Territoires" }).click();
  await page.getByRole("cell", { name: "Startup palace" }).click();
});
