import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, loginWith } from "./utils";

test.beforeAll(async () => {
  await populate();
});

test("Create action with comments", async ({ page }) => {
  const person1Name = nanoid();
  const person2Name = nanoid();
  const actionFor2PersonName = nanoid();

  await loginWith(page, "admin7@example.org");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(person1Name);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(person2Name);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByText("Création réussie !").click();

  await page.getByRole("link", { name: "Agenda" }).click();
  await expect(page).toHaveURL("http://localhost:8090/action?calendarTab=2");
  await page.getByRole("button", { name: "Créer une nouvelle action" }).click();
  await page.getByLabel("Nom de l'action").click();
  await page.getByLabel("Nom de l'action").fill("action avec commentaire");
  await changeReactSelectValue(page, "create-action-person-select", person1Name);
  await page.getByLabel("Description").click();
  await page.getByLabel("Description").fill("Une seule personne");
  await page.getByLabel("Commentaire (optionnel)").click();
  await page.getByLabel("Commentaire (optionnel)").fill("Une personne avec un commentaire prioritaire");
  await page.getByText("Commentaire prioritaire Ce commentaire sera mise en avant par rapport aux autres").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await page.getByText(person1Name).last().click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByText("action avec commentaire").click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/action\/.*/);
  await page.getByText("Une personne avec un commentaire prioritaire").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Commentaire mis à jour").click();

  await page.getByRole("link", { name: "Agenda" }).click();
  await expect(page).toHaveURL("http://localhost:8090/action?calendarTab=2");
  await page.getByRole("button", { name: "Créer une nouvelle action" }).click();
  await page.getByLabel("Nom de l'action").click();
  await page.getByLabel("Nom de l'action").fill(actionFor2PersonName);
  await changeReactSelectValue(page, "create-action-person-select", person1Name);
  await changeReactSelectValue(page, "create-action-person-select", person2Name);
  await page.getByLabel("Commentaire (optionnel)").fill("Un commentaire pour tout le monde");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await page.getByText(person2Name).first().click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByText(actionFor2PersonName).click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/action\/.*/);
  await page.getByText("Un commentaire pour tout le monde").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Commentaire mis à jour").click();

  await page.getByRole("link", { name: "Agenda" }).click();
  await expect(page).toHaveURL("http://localhost:8090/action?calendarTab=2");
  await page.locator(`data-test-id=${actionFor2PersonName}`).getByText(person1Name).click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByText(actionFor2PersonName).click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/action\/.*/);
  await page.getByText("Un commentaire pour tout le monde").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
});
