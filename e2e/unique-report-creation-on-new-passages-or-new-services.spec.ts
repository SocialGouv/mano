import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect } from "./utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";

dayjs.extend(utc);
dayjs.locale("fr");

test.beforeAll(async () => {
  await populate();
});

test.describe.parallel("Unique report creation on new passages or new services", () => {
  const person1Name = nanoid();
  const person2Name = nanoid();
  const person3Name = nanoid();
  const person4Name = nanoid();
  const person5Name = nanoid();

  const createPerson = async (name: string, page: any) => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").fill(name);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
  };

  test("first passages then services", async ({ page }) => {
    await test.step("Log in with team 10", async () => {
      await page.goto("http://localhost:8090/");
      await page.goto("http://localhost:8090/auth");
      await page.getByLabel("Email").click();
      await page.getByLabel("Email").fill("admin10@example.org");
      await page.getByLabel("Mot de passe").click();
      await page.getByLabel("Mot de passe").fill("secret");
      await page.getByRole("button", { name: "Se connecter" }).click();
      await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");
    });

    await test.step("Create 3 persons", async () => {
      await createPerson(person1Name, page);
      await createPerson(person2Name, page);
      await createPerson(person3Name, page);
    });

    await test.step("Add 1 passage for all of them", async () => {
      await page.getByRole("link", { name: "Accueil" }).click();
      await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

      await clickOnEmptyReactSelect(page, "person-select-and-create-reception", person1Name);
      await changeReactSelectValue(page, "person-select-and-create-reception", person2Name);
      await changeReactSelectValue(page, "person-select-and-create-reception", person3Name);

      await page.getByRole("button", { name: "Passage" }).click();
    });

    await test.step("Add some services", async () => {
      await page.locator('[id="Café-add"]').click({ clickCount: 3 });
    });

    await test.step("Check in stats that the data from today is visible", async () => {
      await page.getByRole("link", { name: "Statistiques" }).click();
      await expect(page).toHaveURL("http://localhost:8090/stats");
      await page.getByRole("button", { name: "Entre... et le..." }).click();
      await page.getByRole("button", { name: "Aujourd'hui" }).click({ clickCount: 1 });
      await page.getByRole("list").getByText("Accueil").click();

      await expect(page.getByRole("row", { name: "Café 3 100%" }).getByRole("cell", { name: "3" })).toBeVisible();
      await expect(page.getByText("Nombre de passages3")).toBeVisible();
    });

    await test.step("Check in reports that the data from today is visible", async () => {
      await page.getByRole("link", { name: "Comptes rendus" }).click();
      await expect(page).toHaveURL("http://localhost:8090/report");
      await expect(page.locator(`data-test-id=report-dot-${dayjs().format("YYYY-MM-DD")}`)).toBeVisible();
      await page.getByRole("button", { name: dayjs().format("YYYY-MM-DD") }).click();
      await page.getByRole("navigation", { name: "Navigation dans les catégories du compte-rendu" }).getByText("Accueil").click();
      await expect(page.locator('[data-test-id="Team Test - 10-Café-3"]')).toBeVisible();
      await page.getByText("Passages (3)").click();
      await page.getByText("Personnes créées (3)").click();
    });
  });

  test("then the opposite: services then passages", async ({ page }) => {
    await test.step("Log in with team 11", async () => {
      await page.goto("http://localhost:8090/");
      await page.goto("http://localhost:8090/auth");
      await page.getByLabel("Email").click();
      await page.getByLabel("Email").fill("admin11@example.org");
      await page.getByLabel("Mot de passe").click();
      await page.getByLabel("Mot de passe").fill("secret");
      await page.getByRole("button", { name: "Se connecter" }).click();
      await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
      await page.getByRole("button", { name: "Se connecter" }).click();
      await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");
    });

    await test.step("Create 2 persons", async () => {
      await createPerson(person4Name, page);
      await createPerson(person5Name, page);
    });

    await test.step("Add some services", async () => {
      await page.getByRole("link", { name: "Accueil" }).click();
      await page.locator('[id="Café-add"]').click({ clickCount: 6 });
      await page.locator('[id="Douche-add"]').click({ clickCount: 4 });
    });

    await test.step("Add 1 passage for all of them", async () => {
      await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

      await clickOnEmptyReactSelect(page, "person-select-and-create-reception", person4Name);
      await changeReactSelectValue(page, "person-select-and-create-reception", person5Name);

      await page.getByRole("button", { name: "Passage" }).click();
    });

    await test.step("Check in stats that the data from today is visible", async () => {
      await page.getByRole("link", { name: "Statistiques" }).click();
      await expect(page).toHaveURL("http://localhost:8090/stats");
      await page.getByRole("button", { name: "Entre... et le..." }).click();
      await page.getByRole("button", { name: "Aujourd'hui" }).click({ timeout: 5000 });
      await page.getByRole("list").getByText("Accueil").click();

      await expect(page.getByRole("row", { name: "Café 6 60%" }).getByRole("cell", { name: "6" })).toBeVisible();
      await expect(page.getByRole("row", { name: "Douche 4 40%" }).getByRole("cell", { name: "4" })).toBeVisible();
      await expect(page.getByText("Nombre de passages2")).toBeVisible();
    });

    await test.step("Check in reports that the data from today is visible", async () => {
      await page.getByRole("link", { name: "Comptes rendus" }).click();
      await expect(page).toHaveURL("http://localhost:8090/report");
      await expect(page.locator(`data-test-id=report-dot-${dayjs().format("YYYY-MM-DD")}`)).toBeVisible();
      await page.getByRole("button", { name: dayjs().format("YYYY-MM-DD") }).click();
      await page.getByRole("navigation", { name: "Navigation dans les catégories du compte-rendu" }).getByText("Accueil").click();
      await expect(page.locator('[data-test-id="Team Test - 11-Café-6"]')).toBeVisible();
      await expect(page.locator('[data-test-id="Team Test - 11-Douche-4"]')).toBeVisible();
      await page.getByText("Passages (2)").click();
      await page.getByText("Personnes créées (2)").click();
    });
  });
});
