import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith } from "./utils";
import { populate } from "./scripts/populate-db";

dayjs.extend(utc);
dayjs.locale("fr");

test.beforeAll(async () => {
  await populate();
});

test("Cross teams report", async ({ page }) => {
  // Always use a new items
  const today = dayjs();
  const team1Name = nanoid();
  const team2Name = nanoid();
  const person1Name = nanoid();
  const person2Name = nanoid();
  const person1action = nanoid();
  const person2action = nanoid();
  const team1Description = nanoid();
  const team2Description = nanoid();
  const team1Collab = nanoid();
  const team2Collab = nanoid();

  await loginWith(page, "admin2@example.org");

  /*
  Create teams

  */

  await test.step("should create teams", async () => {
    await page.getByRole("link", { name: "Équipes" }).click();
    await expect(page).toHaveURL("http://localhost:8090/team");

    await page.getByRole("button", { name: "Créer une nouvelle équipe" }).click();

    await page.getByLabel("Nom").fill(team1Name);

    await page.getByRole("button", { name: "Créer", exact: true }).click();
    await page.locator(".Toastify__close-button").last().click();

    await page.getByRole("button", { name: "Créer une nouvelle équipe" }).click();

    await page.getByLabel("Nom").fill(team2Name);

    // ATTENTION: impossible to test night shift
    // because the results will depend if it's day or night

    // await page.getByLabel("Oui").check(); // night shift

    await page.getByRole("button", { name: "Créer", exact: true }).click();
    await page.locator(".Toastify__close-button").last().click();
  });

  await test.step("should create persons", async () => {
    await changeReactSelectValue(page, "team-selector-topBar", team1Name);

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

    await page.getByLabel("Nom").fill(person1Name);

    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.locator(".Toastify__close-button").last().click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await changeReactSelectValue(page, "team-selector-topBar", team2Name);

    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

    await page.getByLabel("Nom").fill(person2Name);

    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.locator(".Toastify__close-button").last().click();
  });

  await test.step("should create actions", async () => {
    await changeReactSelectValue(page, "team-selector-topBar", team1Name);

    await page.getByRole("link", { name: "Agenda" }).click();

    await page.getByRole("button", { name: "Créer une nouvelle action" }).click();

    await page.getByLabel("Nom de l'action").fill(person1action);

    await changeReactSelectValue(page, "create-action-team-select", team1Name);
    //  await clickOnEmptyReactSelect(page, "create-action-team-select", team1Name);

    await clickOnEmptyReactSelect(page, "create-action-person-select", person1Name);

    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.locator(".Toastify__close-button").last().click();

    await page.getByRole("link", { name: "Agenda" }).click();

    await changeReactSelectValue(page, "team-selector-topBar", team2Name);

    await page.getByRole("button", { name: "Créer une nouvelle action" }).click();

    await page.getByLabel("Nom de l'action").fill(person2action);

    await clickOnEmptyReactSelect(page, "create-action-team-select", team2Name);

    await clickOnEmptyReactSelect(page, "create-action-person-select", person2Name);

    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.locator(".Toastify__close-button").last().click();
  });

  /*
  Add passages and services in reception

  */
  await test.step("should add passages and services in reception with team 1", async () => {
    await changeReactSelectValue(page, "team-selector-topBar", team1Name);

    await page.getByRole("link", { name: "Accueil" }).click();

    await expect(page.locator("data-test-id=reception-title")).toContainText(
      `Accueil du ${dayjs().format("dddd D MMMM YYYY")} de l'équipe ${team1Name}`
    );

    await expect(page.locator(`data-test-id=${person1action}`)).toBeVisible();

    expect(page.locator('[id="passages-title"]')).toContainText("0 passage");
    await page.getByRole("button", { name: "Passage anonyme" }).click({ clickCount: 2 });
    expect(page.locator('[id="passages-title"]')).toContainText("2 passages");

    expect(page.locator('[id="Café-count"]')).toHaveValue("0");
    await page.locator('[id="Café-add"]').click({ clickCount: 2 });
    expect(page.locator('[id="Café-count"]')).toHaveValue("2");

    expect(page.locator('[id="Douche-count"]')).toHaveValue("0");
    await page.locator('[id="Douche-add"]').click({ clickCount: 3 });
    expect(page.locator('[id="Douche-count"]')).toHaveValue("3");
  });

  await test.step("should add passages and services in reception with team 2", async () => {
    await changeReactSelectValue(page, "team-selector-topBar", team2Name);

    // await expect(page.locator("data-test-id=reception-title")).toContainText(
    //   `Accueil du ${dayjs().format("dddd D MMMM YYYY")} de l'équipe de nuit ${team2Name}`
    // );
    await expect(page.locator("data-test-id=reception-title")).toContainText(
      `Accueil du ${dayjs().format("dddd D MMMM YYYY")} de l'équipe ${team2Name}`
    );

    await expect(page.locator(`data-test-id=${person2action}`)).toBeVisible();

    expect(page.locator('[id="passages-title"]')).toContainText("0 passage");
    await page.getByRole("button", { name: "Passage anonyme" }).click({ clickCount: 4 });
    expect(page.locator('[id="passages-title"]')).toContainText("4 passages");
    expect(page.locator('[id="Café-count"]')).toHaveValue("0");
    await page.locator('[id="Café-add"]').click({ clickCount: 2 });
    expect(page.locator('[id="Café-count"]')).toHaveValue("2");

    expect(page.locator('[id="Douche-count"]')).toHaveValue("0");

    expect(page.locator('[id="Repas-count"]')).toHaveValue("0");
    await page.locator('[id="Repas-add"]').click({ clickCount: 3 });
    expect(page.locator('[id="Repas-count"]')).toHaveValue("3");
  });

  await test.step("should be able to go to report from reception and see activity of team 1", async () => {
    await changeReactSelectValue(page, "team-selector-topBar", team1Name);
    await page.getByRole("button", { name: "Modifier les passages" }).click();
    await expect(page).toHaveURL(`http://localhost:8090/report/${dayjs().format("YYYY-MM-DD")}?tab=passages`);
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
  });

  await test.step("should be able to add a collab and a description in team 1", async () => {
    await page.getByText("Résumé").click();
    await page.locator(".report-select-collaboration__value-container").click();
    await page.getByLabel("Collaboration").fill(team1Collab);
    await page.getByText(`Créer "${team1Collab}"`).click();
    await page.locator(".Toastify__close-button").last().click();
    await page.getByRole("button", { name: "Mettre à jour" }).click();
    await page.locator(".Toastify__close-button").last().click();

    await page.getByRole("button", { name: "Ajouter une description" }).click();
    await page.getByLabel("Description").click();
    await page.getByLabel("Description").fill(team1Description);
    await page.getByRole("button", { name: "Enregistrer" }).click();
  });

  await test.step("should see activity of team 2 only in report", async () => {
    await page.locator(".report-select-teams__multi-value__remove").click();
    await clickOnEmptyReactSelect(page, "report-select-teams", team2Name);

    await page.getByText("Passages (4)").click();
    await page.getByText("Actions créées (1)").click();
    await expect(page.locator(`data-test-id=${person1action}`)).toBeHidden();
    await expect(page.locator(`data-test-id=${person2action}`)).toBeVisible();
    await page.getByText("Personnes créées (1)").click();
    await expect(page.locator(`data-test-id=${person1Name}`)).toBeHidden();
    await expect(page.locator(`data-test-id=${person2Name}`)).toBeVisible();
  });

  await test.step("should be able to add a collab and a description in team 2", async () => {
    await page.getByText("Résumé").click();
    await page.locator(".report-select-collaboration__value-container").click();
    await page.getByLabel("Collaboration").fill(team2Collab);
    await page.getByText(`Créer "${team2Collab}"`).click();
    await page.locator(".Toastify__close-button").last().click();
    await page.getByRole("button", { name: "Mettre à jour" }).click();
    await page.locator(".Toastify__close-button").last().click();

    await page.getByRole("button", { name: "Ajouter une description" }).click();
    await page.getByLabel("Description").click();
    await page.getByLabel("Description").fill(team2Description);
    await page.getByRole("button", { name: "Enregistrer" }).click();
  });

  await test.step("should see activity of all teams in report", async () => {
    // await page.getByLabel("Comptes rendus de toutes les équipes").check();
    await changeReactSelectValue(page, "report-select-teams", team1Name);

    await page
      .getByRole("navigation", {
        name: "Navigation dans les catégories du compte-rendu",
      })
      .getByText("Résumé")
      .click();

    await expect(page.getByText(team1Collab)).toBeVisible();
    await expect(page.getByText(team2Collab)).toBeVisible();
    await expect(page.getByText(team1Description)).toBeVisible();
    await expect(page.getByText(team2Description)).toBeVisible();

    await page
      .getByRole("navigation", {
        name: "Navigation dans les catégories du compte-rendu",
      })
      .getByText("Accueil")
      .click();

    await expect(page.locator(`data-test-id=general-Café-4`)).toBeVisible();
    await expect(page.locator(`data-test-id=general-Douche-3`)).toBeVisible();
    await expect(page.locator(`data-test-id=general-Repas-3`)).toBeVisible();

    await page.getByRole("button", { name: "Afficher" }).first().click();
    await page.getByRole("button", { name: "Afficher" }).first().click();

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
  });

  await test.step("should see list of reports and being able to click on it, click on prev and next", async () => {
    await page.getByRole("link", { name: "Comptes rendus" }).click();
    await expect(page).toHaveURL("http://localhost:8090/report");

    await page.getByRole("button", { name: dayjs().format("YYYY-MM-DD") }).click();

    await expect(page.getByText(`${dayjs().format("dddd D MMMM YYYY")}`)).toBeVisible();

    await page.getByRole("button", { name: "Précédent" }).click();

    await expect(page.getByText(`${dayjs().add(-1, "day").format("dddd D MMMM YYYY")}`)).toBeVisible();

    await page.getByRole("button", { name: "Suivant" }).click();

    await expect(page.getByText(`${dayjs().format("dddd D MMMM YYYY")}`)).toBeVisible();
  });
});
