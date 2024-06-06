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

// Le but de ce test est de vérifier qu'on ne peut pas déverrouiller avec n'importe quelle clé
test("Verrouiller et déverrouiller la session", async ({ page }) => {
  await loginWith(page, "admin4@example.org");
  await page.getByRole("button", { name: "Verrouiller/Recharger" }).click();
  await page.locator('[data-test-id="modal"]').getByLabel("Clé de chiffrement").fill("pas la bonne");
  await page.getByRole("button", { name: "Se reconnecter" }).click();
  await page.getByText("Clé de chiffrement invalide").click();
  await page.locator('[data-test-id="modal"]').getByLabel("Clé de chiffrement").fill("encore raté");
  await page.getByRole("button", { name: "Se reconnecter" }).click();
  await page.getByText("Clé de chiffrement invalide").click();
  await page.locator('[data-test-id="modal"]').getByLabel("Clé de chiffrement").fill("plouf");
  await page.getByRole("button", { name: "Se reconnecter" }).click();
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("heading", { name: "Informations générales" }).click();
});
