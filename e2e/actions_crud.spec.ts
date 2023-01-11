import { test, expect, Page } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, createAction, loginWith } from "./utils";

test.beforeAll(async () => {
  await populate();
});
test.setTimeout(120000);
const createGroup = async (page: Page, groupName: string) => {
  await page.getByRole("button", { name: "Ajouter un groupe" }).click();
  await page.getByLabel("Titre du groupe").fill(groupName);
  await page.getByRole("dialog", { name: "Ajouter un groupe de catégories" }).getByRole("button", { name: "Ajouter" }).click();
  await page.getByText("Groupe ajouté").click();
};

test("Actions", async ({ page }) => {
  const personName = nanoid();
  const action1Name = nanoid();
  const action2Name = nanoid();

  await loginWith(page, "admin1@example.org");

  await test.step("Create one person to assign actions", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").click();
    await page.getByLabel("Nom").fill(personName);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
  });

  await test.step("Create actions", async () => {
    await createAction(page, action1Name, personName);
  });

  await test.step("Update action", async () => {
    await page.getByRole("link", { name: "Agenda" }).click();
    await page.getByText(action1Name).click();

    await page.getByLabel("Nom").fill(action2Name);
    await page.getByLabel("Description").fill("plouf");

    await page.getByLabel("Action prioritaire Cette action sera mise en avant par rapport aux autres").check();
    await page.getByLabel("Montrer l'heure").check();
    await page.getByLabel("À faire le").fill("11/12/2002");

    await page.getByRole("button", { name: "Mettre à jour" }).click();
    await page.getByText("Mise à jour !").click();

    await changeReactSelectValue(page, "update-action-select-status", "FAITE");

    await page.getByRole("button", { name: "Mettre à jour" }).click();
    await page.getByText("Mise à jour !").click();

    await page.getByLabel("À faire le").fill("12/12/2002");

    await page.getByRole("button", { name: "Mettre à jour" }).click();
    await page.getByText("Mise à jour !").click();

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(`Êtes-vous sûr ?`);
      dialog.accept();
    });
    await page.getByRole("button", { name: "Supprimer" }).click();
    await expect(page).toHaveURL("http://localhost:8090/action?calendarTab=2");

    await page.getByText("Suppression réussie").click();
  });
});
