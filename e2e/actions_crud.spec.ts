import { test, expect, Page } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, createAction, loginWith } from "./utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";

test.beforeAll(async () => {
  await populate();
});

test("Actions", async ({ page }) => {
  const personName = nanoid();
  const action1Name = nanoid();
  const action2Name = nanoid();

  await loginWith(page, "admin1@example.org");

  await test.step("Create one person to assign actions", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("button", { name: "Créer une personne" }).click();
    await page.getByLabel("Nom").click();
    await page.getByLabel("Nom").fill(personName);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
  });

  await test.step("Actions should have at least a name or a category", async () => {
    await page.getByRole("link", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Créer une action" }).click();
    await clickOnEmptyReactSelect(page, "create-action-person-select", personName);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("L'action doit avoir au moins un nom ou une catégorie").click();
    await page.getByLabel("Nom de l'action").fill("Un joli nom");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await page.getByRole("link", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Créer une action" }).click();
    await clickOnEmptyReactSelect(page, "create-action-person-select", personName);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("L'action doit avoir au moins un nom ou une catégorie").click();
    await page.locator("#categories").getByText("Choisir...").click();
    await page.getByRole("button", { name: "impots" }).click();
    await page.getByRole("dialog", { name: "Sélectionner des catégories" }).getByRole("button", { name: "Fermer" }).click();

    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await expect(page.getByRole("cell", { name: "impots impots" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Un joli nom" })).toBeVisible();
  });

  await test.step("Create actions", async () => {
    await createAction(page, action1Name, personName);
  });

  await test.step("Update action", async () => {
    await page.getByRole("link", { name: "Agenda" }).click();
    await page.getByText(action1Name).click();
    await page.getByRole("button", { name: "Modifier" }).click();
    await page.getByLabel("Nom").fill(action2Name);
    await page.getByLabel("Description").fill("plouf");
    await page.getByLabel("Action prioritaire Cette action sera mise en avant par rapport aux autres").check();
    await page.getByLabel("Montrer l'heure").check();
    await page.getByLabel("À faire le").fill(dayjs().format("YYYY-MM-DDTHH:mm"));
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Mise à jour !").click();

    await page.getByRole("cell", { name: action2Name }).click();
    await changeReactSelectValue(page, "update-action-select-status", "FAITE");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Mise à jour !").click();

    await changeReactSelectValue(page, "action-select-status-filter", "FAITE");

    await page.getByRole("cell", { name: action2Name }).click();
    await page.getByRole("button", { name: "Historique" }).click();
    await page.locator(`[data-test-id="Nom de l'action\\: \\"${action1Name}\\" ➔ \\"${action2Name}\\""]`).click();
    await page.locator(`[data-test-id="Description\\: \\"\\" ➔ \\"plouf\\""]`).click();
    await page.locator('[data-test-id="Action urgente\\: \\"\\" ➔ true"]').click();
    await page.locator('[data-test-id="Statut\\: \\"A FAIRE\\" ➔ \\"FAIT\\""]').click();

    await page.getByText("Fermer").click();

    await page.getByRole("cell", { name: action2Name }).click();
    await page.getByRole("button", { name: "Modifier" }).click();
    page.once("dialog", (dialog) => {
      expect(dialog.message()).toBe(`Voulez-vous supprimer cette action ?`);
      dialog.accept();
    });
    await page.getByRole("button", { name: "Supprimer" }).click();
    await expect(page).toHaveURL("http://localhost:8090/action");

    await page.getByText("Suppression réussie").click();
  });
});
