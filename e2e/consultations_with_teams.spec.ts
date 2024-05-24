import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith, logOut } from "./utils";

dayjs.extend(utc);
dayjs.locale("fr");

test.beforeAll(async () => {
  await populate();
});

test("test", async ({ page }) => {
  await loginWith(page, "admin1@example.org");
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("link", { name: "Équipes" }).click();
  await page.getByRole("button", { name: "Créer une équipe" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("Équipe 2");
  await page.getByRole("dialog").getByRole("button", { name: "Créer" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("Manu Chao");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await page.getByRole("button", { name: "Ajouter une consultation" }).click();
  await page.getByLabel("Nom (facultatif)").click();
  await page.getByLabel("Nom (facultatif)").fill("Une consultation");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Veuillez choisir un type de consultation").click();
  await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Veuillez sélectionner au moins une équipe").click();
  await clickOnEmptyReactSelect(page, "create-consultation-team-select", "Team Test - 1");
  await changeReactSelectValue(page, "create-consultation-team-select", "Équipe 2");
  const createdAt = dayjs().format("dddd D MMMM YYYY HH:mm");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByRole("cell", { name: `${createdAt} Une consultation - Médicale Team Test - 1 Équipe 2 Créée par User Admin Test - 1` }).click();
});
