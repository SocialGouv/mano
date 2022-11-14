import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { changeReactSelectValue } from "./utils";

test("Create action with comments", async ({ page }) => {
  const person1Name = nanoid();
  const person2Name = nanoid();

  await page.goto("http://localhost:8090/");
  await page.goto("http://localhost:8090/auth");
  await page.getByLabel("Email").click();
  await page.getByLabel("Email").fill("admin6@example.org");
  await page.getByLabel("Mot de passe").fill("secret");
  await page.getByLabel("Mot de passe").press("Enter");
  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
  await page.getByLabel("Clé de chiffrement d'organisation").press("Enter");
  await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page
    .getByRole("button", { name: "Créer une nouvelle personne" })
    .click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(person1Name);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByText("Création réussie !").click();
  await page
    .getByRole("button", { name: "Créer une nouvelle personne" })
    .click();
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
  await changeReactSelectValue(
    page,
    "create-action-person-select",
    person1Name
  );
  await page.getByLabel("Description").click();
  await page.getByLabel("Description").fill("Une seule personne");
  await page.getByLabel("Commentaire (optionnel)").click();
  await page
    .getByLabel("Commentaire (optionnel)")
    .fill("Une personne avec un commentaire prioritaire");
  await page
    .getByText(
      "Commentaire prioritaire Ce commentaire sera mise en avant par rapport aux autres"
    )
    .click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await page.getByText(person1Name).last().click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByText("Actions (1)").click();
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
  await page.getByLabel("Nom de l'action").fill("Action sur deux personnes");
  await changeReactSelectValue(
    page,
    "create-action-person-select",
    person1Name
  );
  await changeReactSelectValue(
    page,
    "create-action-person-select",
    person2Name
  );
  await page
    .getByLabel("Commentaire (optionnel)")
    .fill("Un commentaire pour tout le monde");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await page.getByText(person2Name).last().click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByText("Actions (1)").click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByText("Action sur deux personnes").click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/action\/.*/);
  await page.getByText("Un commentaire pour tout le monde").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Commentaire mis à jour").click();

  await page.getByRole("link", { name: "Agenda" }).click();
  await expect(page).toHaveURL("http://localhost:8090/action?calendarTab=2");
  await page
    .getByRole("row", {
      name: "Action sur deux personnes " + person1Name + " A FAIRE",
    })
    .getByText(person1Name)
    .click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);

  await page.getByText("Actions (2)").click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByText("Action sur deux personnes").click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/action\/.*/);
  await page.getByText("Un commentaire pour tout le monde").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
});
