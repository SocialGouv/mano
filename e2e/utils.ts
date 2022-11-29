import { expect, Page } from "@playwright/test";

export async function clickOnEmptyReactSelect(page: Page, name: string, text: string) {
  await page.locator(`.${name}__dropdown-indicator`).click();
  await page.locator(`.${name}__menu`).getByText(text, { exact: true }).click();
}

export async function changeReactSelectValue(page: Page, name: string, text: string) {
  await page.locator(`.${name}__dropdown-indicator`).click();
  await page.locator(`.${name}__menu`).getByText(text, { exact: true }).click();
}

export async function loginWith(page: Page, email: string, password: string = "secret", orgKey: string = "plouf") {
  await page.goto("http://localhost:8090/auth");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.getByLabel("Clé de chiffrement d'organisation").fill(orgKey);
  await page.getByRole("button", { name: "Se connecter" }).click();
}

export async function logOut(page: Page, name: string) {
  await page.getByRole("button", { name }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter et supprimer toute trace de mon passage" }).click();
  await expect(page).toHaveURL("http://localhost:8090/auth");
}

export async function createAction(
  page: Page,
  actionName: string,
  personName: string,
  options: {
    categories?: Array<{ group: string; category: string }>;
    group?: boolean;
  } = { categories: [], group: false }
) {
  await page.getByRole("link", { name: "Agenda" }).click();
  await page.getByRole("button", { name: "Créer une nouvelle action" }).click();
  await page.getByLabel("Nom de l'action").fill(actionName);
  await clickOnEmptyReactSelect(page, "create-action-person-select", personName);
  const { categories = [], group = false } = options;
  if (categories.length > 0) {
    await page.locator("#categories").getByText("-- Choisir --").click();
    for (const { group, category } of categories) {
      await page.getByRole("button", { name: `${group} (2)` }).click();
      await page.getByRole("button", { name: category }).click();
    }
    await page.getByRole("button", { name: "Fermer" }).click();
  }
  if (group) {
    await page.getByLabel("Action familiale Cette action sera à effectuer pour toute la famille").check();
  }
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
}

export async function createPerson(page: Page, name: string) {
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(name);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
}
