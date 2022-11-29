import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith } from "./utils";

test.beforeAll(async () => {
  await populate();
});

test("Familles", async ({ page }) => {
  // Always use a new items
  const person1Name = nanoid();
  const person2Name = nanoid();
  const person3Name = nanoid();
  const person4Name = nanoid();
  const action1Name = nanoid();
  const action2Name = nanoid();
  const action3Name = nanoid();

  const createAction = async (actionName: string, personName: string) => {
    await page.getByRole("link", { name: "Agenda" }).click();
    await page.getByRole("button", { name: "Créer une nouvelle action" }).click();
    await page.getByLabel("Nom de l'action").fill(actionName);
    await clickOnEmptyReactSelect(page, "create-action-person-select", personName);
    await page.locator("#categories").getByText("-- Choisir --").click();
    await page.getByRole("button", { name: "Fermer" }).click();
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
  };

  const createPerson = async (name: string) => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").click();
    await page.getByLabel("Nom").fill(name);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
  };

  await loginWith(page, "admin1@example.org");

  await test.step("Create persons", async () => {
    await createPerson(person1Name);
    await createPerson(person2Name);
    await createPerson(person3Name);
    await createPerson(person4Name);
  });
});
