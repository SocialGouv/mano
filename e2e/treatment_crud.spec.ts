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

test("Traitement", async ({ page }) => {
  const personName = "Manu Chao";

  await loginWith(page, "admin1@example.org");
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(personName);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Dossier Médical" }).click();

  await page.getByRole("button", { name: "Ajouter un traitement" }).click();
  await page.getByPlaceholder("Amoxicilline").click();
  await page.getByPlaceholder("Amoxicilline").fill("Paracétamol");
  await page.getByRole("button", { name: "Informations" }).click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Traitement créé !").click();
  await page.getByText("Paracétamol").click();
  await page
    .getByRole("dialog", { name: "Traitement: Paracétamol (créée par User Admin Test - 1)" })
    .getByRole("button", { name: "Historique" })
    .click();
  await page.getByText("Création du traitement").click();
  await page.getByRole("button", { name: "Informations" }).click();
  await page.getByTitle("Modifier ce traitement - seul le créateur peut modifier un traitement").click();
  await page.getByPlaceholder("1mg").click();
  await page.getByPlaceholder("1mg").fill("3mg");
  await page.getByPlaceholder("1 fois par jour").click();
  await page.getByPlaceholder("1 fois par jour").fill("2 fois par jour");
  await page.getByPlaceholder("Angine").click();
  await page.getByPlaceholder("Angine").fill("Grosse toux");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Traitement mis à jour !").click();
  await page.getByText("Paracétamol - Grosse toux - 3mg - 2 fois par jour").click();
  await page
    .getByRole("dialog", { name: "Traitement: Paracétamol (créée par User Admin Test - 1)" })
    .getByRole("button", { name: "Historique" })
    .click();
  await page.locator('[data-test-id="Dosage\\: \\"\\" ➔ \\"3mg\\""]').click();
  await page.locator('[data-test-id="Fréquence\\: \\"\\" ➔ \\"2 fois par jour\\""]').click();
  await page.locator('[data-test-id="Indication\\: \\"\\" ➔ \\"Grosse toux\\""]').click();
  await page.getByRole("button", { name: "Informations" }).click();
  await page.getByTitle("Modifier ce traitement - seul le créateur peut modifier un traitement").click();

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("Voulez-vous supprimer ce traitement ?");
    dialog.accept();
  });
  await page
    .getByRole("dialog", { name: "Modifier le traitement: Paracétamol (créée par User Admin Test - 1)" })
    .getByRole("button", { name: "Supprimer" })
    .click();
  await page.getByText("Traitement supprimé !").click();
});
