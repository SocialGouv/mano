import { test, expect, Page } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, createAction, createPerson, loginWith } from "./utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";

dayjs.extend(utc);
dayjs.locale("fr");
test.beforeAll(async () => {
  await populate();
});

test("Structures", async ({ page }) => {
  await loginWith(page, "admin1@example.org");
  await page.getByRole("link", { name: "Structures" }).click();
  await expect(page).toHaveURL("http://localhost:8090/structure");

  await page.getByRole("button", { name: "Créer une nouvelle structure" }).click();
  await page.getByLabel("Nom").fill("Structure 1");
  await page.getByLabel("Téléphone").fill("1123456789");
  await page.getByLabel("Adresse (numéro et rue)").fill("1 rue du chemin");
  await page.getByLabel("Code postal").fill("75002");
  await expect(page.getByLabel("Ville")).toHaveValue("PARIS 02");
  await page.getByLabel("Description").fill("joli bébé");
  await page.locator(".categories__input-container").click();
  await page.locator("#categories").fill("infirmerie");
  await page.locator("#categories").press("Enter");
  await page.locator("#categories").fill("caruud");
  await page.locator("#categories").press("Enter");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Structure créée !").click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("link", { name: "Structures" }).click();
  await expect(page).toHaveURL("http://localhost:8090/structure");
  await page.getByRole("button", { name: "Créer une nouvelle structure" }).click();
  await page.getByLabel("Nom").fill("Structure 1");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Une structure avec le même nom existe déjà").click();
  await page.getByLabel("Nom").fill("Structure 2");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Structure créée !").click();

  await page.getByRole("cell", { name: "1123456789" }).click();
  await page.getByLabel("Téléphone").fill("112345678910");
  await page.getByLabel("Adresse (numéro et rue)").fill("1 rue du chemin vert");
  await page.getByLabel("Code postal").fill("75003");
  await expect(page.getByLabel("Ville")).toHaveValue("PARIS 03");
  await page.getByLabel("Description").fill("joli bébé dort");
  await page.locator(".categories__input-container").click();
  await page.locator("#categories").fill("piscine");
  await page.locator("#categories").press("Enter");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Structure mise à jour !").click();
});
