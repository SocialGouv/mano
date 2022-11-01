import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { changeReactSelectValue, clickOnEmptyReactSelect } from "./utils";

dayjs.extend(utc);
dayjs.locale("fr");

test("Cross teams report", async ({ page }) => {
  test.setTimeout(120000);

  // Always use a new items
  const today = dayjs();
  // const team1Name = nanoid();
  // const team2Name = nanoid();
  // const person1Name = nanoid();
  // const person2Name = nanoid();
  // const person1action = nanoid();
  // const person2action = nanoid();
  // const team1Description = nanoid();
  // const team2Description = nanoid();
  // const team1Collab = nanoid();
  // const team2Collab = nanoid();
  const team1Name = "team1Name";
  const team2Name = "team2Name";
  const person1Name = "person1Name";
  const person2Name = "person2Name";
  const person1action = "person1action";
  const person2action = "person2action";
  const team1Description = "team1Description";
  const team2Description = "team2Description";
  const team1Collab = "team1Collab";
  const team2Collab = "team2Collab";

  /*
  Login

  */
  await page.goto("http://localhost:8090/");

  await page.goto("http://localhost:8090/auth");

  await page.getByLabel("Email").click();

  await page.getByLabel("Email").fill("admin1@example.org");

  await page.getByLabel("Mot de passe").click();

  await page.getByLabel("Mot de passe").fill("secret");

  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");

  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

  /*
  Create teams

  */

  await page.getByRole("link", { name: "Équipes" }).click();
  await expect(page).toHaveURL("http://localhost:8090/team");

  await page.getByRole("button", { name: "Créer une nouvelle équipe" }).click();

  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(team1Name);

  await page.getByRole("button", { name: "Créer" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("button", { name: "Créer une nouvelle équipe" }).click();

  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(team2Name);

  await page.getByLabel("Oui").check(); // night shift

  await page.getByRole("button", { name: "Créer" }).click();
  await page.locator(".Toastify__close-button").click();

  /*
  Create persons

  */
  await changeReactSelectValue(page, "team-selector-topBar", team1Name);

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(person1Name);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await changeReactSelectValue(page, "team-selector-topBar", team2Name);

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill(person2Name);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").click();

  /*
  Create actions

  */
  await changeReactSelectValue(page, "team-selector-topBar", team1Name);

  await page.getByRole("link", { name: "Agenda" }).click();

  await page.getByRole("button", { name: "Créer une nouvelle action" }).click();

  await page.getByLabel("Nom de l'action").click();

  await page.getByLabel("Nom de l'action").fill(person1action);

  await clickOnEmptyReactSelect(page, "create-action-team-select", team1Name);

  await clickOnEmptyReactSelect(page, "create-action-person-select", person1Name);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").click();

  await page.getByRole("link", { name: "Agenda" }).click();

  await changeReactSelectValue(page, "team-selector-topBar", team2Name);

  await page.getByRole("button", { name: "Créer une nouvelle action" }).click();

  await page.getByLabel("Nom de l'action").click();

  await page.getByLabel("Nom de l'action").fill(person2action);

  await clickOnEmptyReactSelect(page, "create-action-team-select", team2Name);

  await clickOnEmptyReactSelect(page, "create-action-person-select", person2Name);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".Toastify__close-button").click();

  /*
  Add passages and services in reception

  */
  await changeReactSelectValue(page, "team-selector-topBar", team1Name);

  await page.getByRole("link", { name: "Accueil" }).click();

  await expect(page.locator("data-test-id=reception-title")).toContainText(
    `Accueil du ${dayjs().format("dddd D MMMM YYYY")} de l'équipe ${team1Name}`
  );

  await expect(page.locator(`data-test-id=${person1action}`)).toBeVisible();

  expect(page.locator('[id="passages-title"]')).toContainText("0 passage");
  await page.getByRole("button", { name: "Passage anonyme" }).click();
  await page.getByRole("button", { name: "Passage anonyme" }).click();
  expect(page.locator('[id="passages-title"]')).toContainText("2 passages");

  expect(page.locator('[id="Café-count"]')).toContainText("0");
  await page.locator('[id="Café-add"]').click();
  await page.locator('[id="Café-add"]').click();
  expect(page.locator('[id="Café-count"]')).toContainText("2");

  expect(page.locator('[id="Douche-add"]')).toContainText("0");
  await page.locator('[id="Douche-add"]').click();
  await page.locator('[id="Douche-add"]').click();
  await page.locator('[id="Douche-add"]').click();
  expect(page.locator('[id="Douche-add"]')).toContainText("3");

  await changeReactSelectValue(page, "team-selector-topBar", team2Name);

  await expect(page.locator("data-test-id=reception-title")).toContainText(
    `Accueil du ${dayjs().format("dddd D MMMM YYYY")} de l'équipe de nuit ${team2Name}`
  );

  await expect(page.locator(`data-test-id=${person2action}`)).toBeVisible();

  expect(page.locator('[id="passages-title"]')).toContainText("0 passage");
  await page.getByRole("button", { name: "Passage anonyme" }).click();
  await page.getByRole("button", { name: "Passage anonyme" }).click();
  await page.getByRole("button", { name: "Passage anonyme" }).click();
  await page.getByRole("button", { name: "Passage anonyme" }).click();
  expect(page.locator('[id="passages-title"]')).toContainText("3 passages");
  expect(page.locator('[id="Café-count"]')).toContainText("0");
  await page.locator('[id="Café-add"]').click();
  await page.locator('[id="Café-add"]').click();
  expect(page.locator('[id="Café-count"]')).toContainText("2");

  expect(page.locator('[id="Douche-count"]')).toContainText("0");

  expect(page.locator('[id="Repas-add"]')).toContainText("0");
  await page.locator('[id="Repas-add"]').click();
  await page.locator('[id="Repas-add"]').click();
  await page.locator('[id="Repas-add"]').click();
  expect(page.locator('[id="Repas-add"]')).toContainText("3");
  await changeReactSelectValue(page, "team-selector-topBar", team1Name);

  /*
  Inside report


  */
  await page.getByRole("button", { name: "Modifier les passages" }).click();
  await expect(page).toHaveURL(
    `http://localhost:8090/report/${dayjs().format("YYYY-MM-DD")}?tab=6`
  );

  await page.getByText("Passages (2)").click();
  await page.getByText("Actions créées (1)").click();
  await expect(page.locator(`data-test-id=${person1action}`)).toBeVisible();
  await expect(page.locator(`data-test-id=${person2action}`)).toBeHidden();
  await page.getByText("Personnes créées (1)").click();
  await expect(page.locator(`data-test-id=${person1Name}`)).toBeVisible();
  await expect(page.locator(`data-test-id=${person2Name}`)).toBeHidden();

  await page.locator('[id="report-button-reception"]').click();

  await expect(page.locator(`data-test-id=${team1Name}-Café-2`)).toBeVisible();
  await expect(page.locator(`data-test-id=${team1Name}-Douche-3`)).toBeVisible();

  await page.getByLabel("Comptes rendus de toutes les équipes").check();

  await expect(page.locator(`data-test-id=general-Café-4`)).toBeVisible();
  await expect(page.locator(`data-test-id=general-Douche-3`)).toBeVisible();
  await expect(page.locator(`data-test-id=general-Repas-3`)).toBeVisible();
  /*
  await page
    .getByText(
      "Certaines équipes travaillent de nuit 🌒, cliquez ici pour savoir la période concernée par chacune"
    )
    .click();

  await page
    .getByRole("group")
    .getByText(`☀️ ${team1Name} - Journée du ${dayjs().format("D MMMM YYYY")}`)
    .click();

  await page
    .getByRole("group")
    .getByText(
      `🌒 ${team2Name} - Nuit du ${dayjs().format("D MMMM YYYY")} au ${dayjs()
        .add(1, "day")
        .format("D MMMM YYYY")}`
    )
    .click();

  await page.getByRole("button", { name: "Afficher" }).first().click();
  await page.getByRole("button", { name: "Afficher" }).click();

  await expect(page.locator(`data-test-id=${team1Name}-Café-2`)).toBeVisible();
  await expect(page.locator(`data-test-id=${team1Name}-Douche-3`)).toBeVisible();
  await expect(page.locator(`data-test-id=${team1Name}-Repas-0`)).toBeVisible();

  await expect(page.locator(`data-test-id=${team2Name}-Café-2`)).toBeVisible();
  await expect(page.locator(`data-test-id=${team2Name}-Douche-0`)).toBeVisible();
  await expect(page.locator(`data-test-id=${team2Name}-Repas-3`)).toBeVisible();

  await page.getByText("Passages (6)").click();
  await page.getByText("Actions créées (2)").click();
  await expect(page.locator(`data-test-id=${person1action}`)).toBeVisible();
  await expect(page.locator(`data-test-id=${person2action}`)).toBeVisible();
  await page.getByText("Personnes créées (2)").click();
  await expect(page.locator(`data-test-id=${person1Name}`)).toBeVisible();
  await expect(page.locator(`data-test-id=${person2Name}`)).toBeVisible();

  await page.getByLabel("Comptes rendus de toutes les équipes").uncheck();

  await page.locator(".report-select-teams__multi-value__remove").click();
  await clickOnEmptyReactSelect(page, "report-select-teams", team2Name);

  await page.getByText("Passages (4)").click();
  await page.getByText("Actions créées (1)").click();
  await expect(page.locator(`data-test-id=${person1action}`)).toBeHidden();
  await expect(page.locator(`data-test-id=${person2action}`)).toBeVisible();
  await page.getByText("Personnes créées (1)").click();
  await expect(page.locator(`data-test-id=${person1Name}`)).toBeHidden();
  await expect(page.locator(`data-test-id=${person2Name}`)).toBeVisible(); */
});
