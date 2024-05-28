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
test.setTimeout(60000);

test("merging normal user with health data", async ({ page }) => {
  const person1Name = nanoid();
  const person2Name = nanoid();
  const person3Name = nanoid();
  const person4Name = nanoid();

  await test.step("Admin creates person and medical files", async () => {
    await loginWith(page, "admin1@example.org");

    await page.getByRole("link", { name: "Organisation" }).click();
    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await page.getByRole("button", { name: "Ajouter un champ" }).click();
    await page.getByLabel("Nom").fill("Multi-champ");
    await changeReactSelectValue(page, "type", "Choix multiple dans une liste");
    await page.getByLabel("Choix", { exact: true }).fill("choix 1");
    await page.keyboard.press("Enter");
    await page.getByLabel("Choix", { exact: true }).fill("choix 2");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Mise à jour !").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("button", { name: "Créer une personne" }).click();
    await page.getByLabel("Nom").fill("1");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("button", { name: "Créer une personne" }).click();
    await page.getByLabel("Nom").fill("2");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("button", { name: "Créer une personne" }).click();
    await page.getByLabel("Nom").fill("3");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("button", { name: "Créer une personne" }).click();
    await page.getByLabel("Nom").fill("4");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
  });
  await test.step("setup different string medical field for two people", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("cell", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await page.getByRole("button", { name: "Éditer les dossier médical" }).click();
    await page.getByLabel("Numéro de sécurité sociale").fill("123");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Mis à jour !").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("cell", { name: "2", exact: true }).click();
    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await page.getByRole("button", { name: "Éditer les dossier médical" }).click();
    await page.getByLabel("Numéro de sécurité sociale").fill("456");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Mis à jour !").click();
  });

  await test.step("setup array medical field for one person", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("cell", { name: "3", exact: true }).click();
    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await page.getByRole("button", { name: "Éditer les dossier médical" }).click();
    await clickOnEmptyReactSelect(page, "person-custom-select-multi-champ", "choix 1");
    await changeReactSelectValue(page, "person-custom-select-multi-champ", "choix 2");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Mis à jour !").click();
  });

  await test.step("try to merge as health professional", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("cell", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "Fusionner avec un autre dossier" }).click();
    await clickOnEmptyReactSelect(page, "person-to-merge-with-select", "2");
    await expect(page.locator(".person-to-merge-with-select__value-container")).toHaveText("2");
    await expect(page.getByRole("cell", { name: "Numéro de sécurité sociale" })).toBeVisible();
    await changeReactSelectValue(page, "person-to-merge-with-select", "3");
    await expect(page.getByRole("cell", { name: "Multi-champ" })).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
  });

  await test.step("login as normal user and try to merge", async () => {
    await page.getByRole("button", { name: "User Admin Test - 1" }).click();

    await page.getByRole("menuitem", { name: "Se déconnecter", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:8090/auth");
    await page.getByLabel("Email").fill("normal1@example.org");
    await page.getByLabel("Mot de passe").fill("secret");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");
  });

  await test.step("merge two people with string medical field different should be forbidden", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("cell", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "Fusionner avec un autre dossier" }).click();
    const forbiddenMergeListener = async (dialog) => {
      expect(dialog.message()).toBe(
        "Les champs médicaux ne sont pas identiques. Vous devez être un·e professionnel·le de santé pour fusionner des dossiers médicaux différents."
      );
      await dialog.accept();
    };
    page.on("dialog", forbiddenMergeListener);
    await clickOnEmptyReactSelect(page, "person-to-merge-with-select", "2");
    page.off("dialog", forbiddenMergeListener);
  });

  await test.step("merge two people, one with medical field the other not, to be possible, but without being visible", async () => {
    await clickOnEmptyReactSelect(page, "person-to-merge-with-select", "3");
    await expect(page.locator(".person-to-merge-with-select__value-container")).toHaveText("3");
    await expect(page.getByRole("cell", { name: "Multi-champ" })).not.toBeVisible();
    const mergeListener = async (dialog) => {
      expect(dialog.message()).toBe("Cette opération est irréversible, êtes-vous sûr ?");
      await dialog.accept();
    };
    page.on("dialog", mergeListener);
    await page.getByRole("button", { name: "Fusionner", exact: true }).click();
    await page.getByText("Fusion réussie !").click();
    page.off("dialog", mergeListener);
  });

  await test.step("login as health professional and try to merge", async () => {
    await page.getByRole("button", { name: "User Normal Test - 1" }).click();

    await page.getByRole("menuitem", { name: "Se déconnecter", exact: true }).click();
    await expect(page).toHaveURL("http://localhost:8090/auth");
    await page.getByLabel("Email").fill("admin1@example.org");
    await page.getByLabel("Mot de passe").fill("secret");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("cell", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await page.getByText("123").click();
    await page.getByText("choix 1").click();
    await page.getByText("choix 2").click();
    await page.getByRole("button", { name: "Résumé" }).click();
    await page.getByRole("button", { name: "Fusionner avec un autre dossier" }).click();
    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toBe("Cette opération est irréversible, êtes-vous sûr ?");
      await dialog.accept();
    });
    await clickOnEmptyReactSelect(page, "person-to-merge-with-select", "2");
    await expect(page.locator(".person-to-merge-with-select__value-container")).toHaveText("2");
    await page.locator('input[name="numeroSecuriteSociale"]').fill("456");
    await page.getByRole("button", { name: "Fusionner", exact: true }).click();
    await page.getByText("Fusion réussie !").click();
    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await page.getByText("456").click();
    await page.getByText("choix 1").click();
    await page.getByText("choix 2").click();
  });
});
