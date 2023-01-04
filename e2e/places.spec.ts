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

test("Lieux fréquentés", async ({ page }) => {
  await loginWith(page, "admin1@example.org");

  await page.getByRole("link", { name: "Personnes suivies" }).click();

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").fill("personne 1");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await page.getByRole("button", { name: "Lieux fréquentés (0)" }).click();
  await page.getByRole("button", { name: "Je veux le nouveau fonctionnement !" }).click();
  await page.getByText("Merci pour votre retour !").click();

  await page.getByRole("button", { name: "Ajouter un lieu" }).click();
  await page.locator(".place__input-container").click();
  await page.getByLabel("Lieu", { exact: true }).fill("gare");
  await page.getByText(/Créer\s+"gare"/).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Le lieu a été ajouté").click();
  await expect(page.locator("data-test-id=gare")).toBeVisible();

  await page.getByRole("button", { name: "Ajouter un lieu" }).click();
  await page.getByLabel("Lieu", { exact: true }).fill("parking");
  await page.getByText(/Créer\s+"parking"/).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Le lieu a été ajouté").click();
  await expect(page.locator("data-test-id=parking")).toBeVisible();

  await page.hover("data-test-id=parking");
  await page.getByRole("button", { name: "Modifier le nom du lieu parking" }).click();
  await page.getByPlaceholder("parking").fill("parking haut");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Le nom du lieu a été modifié").click();
  await expect(page.locator("data-test-id=parking haut")).toBeVisible();
  await expect(page.locator("data-test-id=parking")).not.toBeVisible();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").fill("personne 2");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await page.getByRole("button", { name: "Lieux fréquentés (0)" }).click();

  await page.getByRole("button", { name: "Ajouter un lieu" }).click();
  await clickOnEmptyReactSelect(page, "place", "parking haut");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Le lieu a été ajouté").click();
  await expect(page.locator("data-test-id=parking haut")).toBeVisible();

  await page.getByRole("button", { name: "Ajouter un lieu" }).click();
  await clickOnEmptyReactSelect(page, "place", "gare");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Le lieu a été ajouté").click();
  await expect(page.locator("data-test-id=gare")).toBeVisible();

  await page.hover("data-test-id=gare");
  await page.getByRole("button", { name: "Modifier le nom du lieu gare" }).click();
  await page.getByPlaceholder("gare").fill("gare du nord");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Le nom du lieu a été modifié").click();

  await page.getByRole("button", { name: "Ajouter un lieu" }).click();
  await page.getByLabel("Lieu", { exact: true }).fill("faux lieu");
  await page.getByText(/Créer\s+"faux\s+lieu"/).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Le lieu a été ajouté").click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("cell", { name: "personne 1" }).click();
  await page.getByRole("button", { name: "Lieux fréquentés (2)" }).click();
  await page.getByRole("button", { name: "Ajouter un lieu" }).click();
  await clickOnEmptyReactSelect(page, "place", "faux lieu");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Le lieu a été ajouté").click();

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("Êtes-vous sûr de vouloir supprimer ce lieu fréquenté ?");
    dialog.accept();
  });
  await page.getByRole("button", { name: "Supprimer le lieu fréquenté faux lieu" }).click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("cell", { name: "personne 2" }).click();
  await page.getByRole("button", { name: "Lieux fréquentés (3)" }).click();
  await page.hover("data-test-id=gare du nord");
  await page.getByRole("button", { name: "Modifier le nom du lieu gare du nord" }).click();

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe(
      'Voulez-vous vraiment supprimer le lieu "gare du nord" ? Cette action est irréversible et entrainera la suppression de tous les lieux fréquentés associés.'
    );
    dialog.accept();
  });
  await page.getByRole("dialog", { name: "Éditer le nom du lieu" }).getByRole("button", { name: "Supprimer" }).click();
  await page.getByText("Lieu supprimé !").click();
  await expect(page.locator("data-test-id=gare du nord")).not.toBeVisible();
  await expect(page.locator("data-test-id=faux lieu")).toBeVisible();
  await expect(page.locator("data-test-id=parking haut")).toBeVisible();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("cell", { name: "personne 1" }).click();
  await page.getByRole("button", { name: "Lieux fréquentés (1)" }).click();
  await expect(page.locator("data-test-id=gare du nord")).not.toBeVisible();
});
