import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { changeReactSelectValue, clickOnEmptyReactSelect } from "./utils";

dayjs.extend(utc);
dayjs.locale("fr");

test("test", async ({ page }) => {
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

  await changeReactSelectValue(page, "team-selector-topBar", team1Name);

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
  await expect(page.locator(`data-test-id=${person2Name}`)).toBeVisible();
});
