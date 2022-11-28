import { expect, Page } from "@playwright/test";

export async function clickOnEmptyReactSelect(page: Page, name: string, text: string) {
  await page.locator(`.${name}__placeholder`).click();
  await page.locator(`.${name}__menu`).getByText(text, { exact: true }).click();
}

export async function changeReactSelectValue(page: Page, name: string, text: string) {
  await page.locator(`.${name}__control`).click();
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
  await page.getByText("Vous êtes déconnecté(e)").click();
  await expect(page).toHaveURL("http://localhost:8090/auth");
}
