import { expect, test } from "@playwright/test";
import { populate } from "./scripts/populate-db";
import { clickOnEmptyReactSelect, loginWith } from "./utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";

dayjs.extend(utc);
dayjs.locale("fr");
test.beforeAll(async () => {
  await populate();
});

test("Co-interventions", async ({ page }) => {
  await loginWith(page, "admin1@example.org");
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Co-interventions" }).click();
  await page.locator("details[data-group='Toutes mes co-interventions']").getByPlaceholder("Ajouter une co-intervention").fill("infirmerie");
  await page.locator("details[data-group='Toutes mes co-interventions']").getByRole("button", { name: "Ajouter" }).click();
  await page.getByText("Co-intervention ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();
  await page.locator("details[data-group='Toutes mes co-interventions']").getByPlaceholder("Ajouter une co-intervention").fill("infirmerie");
  await page.locator("details[data-group='Toutes mes co-interventions']").getByRole("button", { name: "Ajouter" }).click();
  await page.getByText("Cette co-intervention existe déjà").click();
  await page.locator("details[data-group='Toutes mes co-interventions']").getByPlaceholder("Ajouter une co-intervention").fill("caruud");
  await page.locator("details[data-group='Toutes mes co-interventions']").getByRole("button", { name: "Ajouter" }).click();
  await page.getByText("Co-intervention ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();
  await page.getByText("Co-interventionsToutes mes co-interventions (3)Ma première collab✏️infirmerie✏️c").click();
  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await clickOnEmptyReactSelect(
    page,
    `report-select-collaboration-${"Team Test - 1".replace(/[^a-zA-Z0-9]/g, "-")}${dayjs().format("YYYY-MM-DD")}`,
    "infirmerie"
  );
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Co-interventions" }).click();
  await page.hover(`id=infirmerie`);
  await page.getByRole("button", { name: "Modifier la co-intervention infirmerie" }).click();
  await page.getByPlaceholder("infirmerie").fill("blabla");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Co-intervention mise à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();
  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await page.getByRole("group").locator("span").filter({ hasText: "blabla" }).click();
});
