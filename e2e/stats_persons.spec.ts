import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith, logOut } from "./utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";

dayjs.extend(utc);
dayjs.locale("fr");

test.beforeAll(async () => {
  await populate();
});

// This test uses admin1@example.org
// It creates a random person and then modifies it.
// It could be used as an example for writing new tests.
test("Create and modify a person", async ({ page }) => {
  // Always use a new person name

  await loginWith(page, "admin11@example.org");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByText("Personne test").click();
  await page.getByText("Genre : Femme").click();
  await page.getByText("31/07/2000").click();
  await page.getByText("Suivi·e depuis le : 16/05/2020").click();
  await page.getByText("En rue depuis le : 31/07/2015").click();
  await page.locator('[data-test-id="\\38 8eadc54-0f10-49ab-8da7-7b4290fe2866"]').getByText("Team Test -").click();
  await page.getByRole("button", { name: "Historique" }).click();
  await page.getByText("01/06/2020").click();
  await page.getByText("01/07/2020").click();
  await page.getByText("01/07/2021").click();
  await page.getByRole("link", { name: "Statistiques" }).click();
  await page.getByRole("button", { name: "Entre... et le..." }).click();
  await page.getByRole("button", { name: "2020" }).click();
  await page.locator('[data-test-id="nombre-de-personnes-créées-1"]').click();
  await page.locator('[data-test-id="nombre-de-personnes-suivies-1"]').click();
  await page.getByRole("button", { name: "2020" }).click();
  await page.getByRole("button", { name: "2021" }).click();
  await page.locator('[data-test-id="nombre-de-personnes-créées-0"]').click();
  await page.locator('[data-test-id="nombre-de-personnes-suivies-1"]').click();
  await page.getByRole("button", { name: "Personnes créées", exact: true }).click();
  await page.getByRole("button", { name: "Personnes suivies", exact: true }).click();
  await page.locator('[data-test-id="nombre-de-personnes-suivies-1"]').click();
  await page.getByRole("button", { name: "Retirer" }).click();
  await clickOnEmptyReactSelect(page, `filter-field-0`, "Genre");
  await clickOnEmptyReactSelect(page, `filter-value-0`, "Homme");
  await page.locator('[data-test-id="nombre-de-personnes-suivies-0"]').click();
  await page.getByRole("button", { name: "Retirer" }).click();
  await clickOnEmptyReactSelect(page, `filter-field-0`, "Genre");
  await changeReactSelectValue(page, `filter-value-0`, "Femme");
  await page.locator('[data-test-id="nombre-de-personnes-suivies-1"]').click();
  await page.getByRole("button", { name: "2021" }).click();
  await page.getByRole("button", { name: "2020" }).click();
  await page.locator('[data-test-id="nombre-de-personnes-suivies-0"]').click();
  await page.getByRole("button", { name: "Retirer" }).click();
  await clickOnEmptyReactSelect(page, `filter-field-0`, "Genre");
  await clickOnEmptyReactSelect(page, `filter-value-0`, "Homme");
  await page.locator('[data-test-id="nombre-de-personnes-suivies-1"]').click();
});
