import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { changeReactSelectValue, loginWith } from "./utils";

dayjs.extend(utc);
dayjs.locale("fr");

test.beforeAll(async () => {
  await populate();
});

test("Create action with comments", async ({ page }) => {
  const person1Name = "personne 1";
  const person2Name = "personne 2";
  const actionFor2PersonName = nanoid();

  await loginWith(page, "admin7@example.org");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(person1Name);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.getByRole("button", { name: "Ajouter un commentaire" }).click();
  await page.getByRole("textbox", { name: "Commentaire" }).fill("commentaire prioritaire pour une personne");
  await page.getByText("Commentaire prioritaire Ce commentaire sera mis en avant par rapport aux autres").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Commentaire enregistré").click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
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
  await page.getByText("Action prioritaire Cette action sera mise en avant par rapport aux autres").click();
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
  await page.getByText("Commentaire mis à jour").click();

  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await page.getByRole("button", { name: dayjs().format("YYYY-MM-DD") }).click();
  await page.getByText("Commentaires (4)").click();

  /*









  start here




  */

  await page.getByRole("button", { name: "Actions et commentaires urgents et vigilance" }).click();

  await page.getByRole("dialog", { name: "Commentaires urgents et vigilance" }).getByRole("cell", { name: "action avec commentaire" }).click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/action\/.*/);

  await expect(page.getByRole("heading", { name: "action avec commentaire (créée par User Admin Test - 7)" })).toBeVisible();

  await page.getByRole("button", { name: "Actions et commentaires urgents et vigilance" }).click();
  await page.getByRole("dialog", { name: "Commentaires urgents et vigilance" }).getByText(person1Name).first().click();
  await expect(page.getByRole("dialog", { name: "Commentaires urgents et vigilance" })).not.toBeVisible();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.locator(`[data-test-id="${person1Name}Résumé"]`).getByText(person1Name).click();

  await page.getByRole("button", { name: "Actions et commentaires urgents et vigilance" }).click();
  await page.getByRole("dialog", { name: "Commentaires urgents et vigilance" }).getByText(person1Name).nth(1).click();
  await expect(page.getByRole("dialog", { name: "Commentaires urgents et vigilance" })).not.toBeVisible();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.locator(`[data-test-id="${person1Name}Résumé"]`).getByText(person1Name).click();

  await page.getByRole("button", { name: "Actions et commentaires urgents et vigilance" }).click();
  await page.getByRole("dialog", { name: "Commentaires urgents et vigilance" }).getByText(person1Name).nth(2).click();
  await expect(page.getByRole("dialog", { name: "Commentaires urgents et vigilance" })).not.toBeVisible();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await page.locator(`[data-test-id="${person1Name}Résumé"]`).getByText(person1Name).click();

  await page.getByRole("button", { name: "Actions et commentaires urgents et vigilance" }).click();
  await page.getByRole("dialog", { name: "Commentaires urgents et vigilance" }).getByText("commentaire prioritaire pour une personne").click();
  await expect(page.getByRole("dialog", { name: "Commentaires urgents et vigilance" })).not.toBeVisible();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/.*/);
  await expect(page.locator(`[data-test-id="${person1Name}Résumé"]`).getByText("commentaire prioritaire pour une personne")).toBeVisible();

  await page.getByRole("button", { name: "Actions et commentaires urgents et vigilance" }).click();
  await page.getByRole("dialog", { name: "Commentaires urgents et vigilance" }).getByText("Une personne avec un commentaire prioritaire").click();
  await expect(page.getByRole("dialog", { name: "Commentaires urgents et vigilance" })).not.toBeVisible();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/action\/.*/);
  await page.getByRole("heading", { name: "action avec commentaire (créée par User Admin Test - 7)" }).click();
  await expect(page.getByText("Une personne avec un commentaire prioritaire")).toBeVisible();

  await page.getByRole("button", { name: "Actions et commentaires urgents et vigilance" }).click();
  await page
    .getByRole("dialog", { name: "Commentaires urgents et vigilance" })
    .locator('[data-test-id="action avec commentaire"]')
    .getByRole("button", { name: "Déprioriser" })
    .click();
  await page
    .getByRole("dialog", { name: "Commentaires urgents et vigilance" })
    .locator('[data-test-id="commentaire prioritaire pour une personne"]')
    .getByRole("button", { name: "Déprioriser" })
    .click();
  await page.locator('[data-test-id="Une personne avec un commentaire prioritaire"]').getByRole("button", { name: "Déprioriser" }).click();
  await expect(page.getByRole("dialog", { name: "Commentaires urgents et vigilance" })).not.toBeVisible();

  await page.getByRole("heading", { name: "action avec commentaire (créée par User Admin Test - 7)" }).click();
  await expect(page.getByText("Une personne avec un commentaire prioritaire")).toBeVisible();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByText(person1Name).click();
  await expect(page.getByText("commentaire prioritaire pour une personne")).toBeVisible();

  await expect(page.getByRole("button", { name: "Actions et commentaires urgents et vigilance" })).not.toBeVisible();
});
