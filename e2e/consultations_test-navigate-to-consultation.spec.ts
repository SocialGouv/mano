import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith, logOut } from "./utils";

dayjs.extend(utc);
dayjs.locale("fr");

test.beforeAll(async () => {
  await populate();
});

test("test", async ({ page }) => {
  await page.goto("http://localhost:8090/");

  await page.goto("http://localhost:8090/auth");

  await page.getByLabel("Email").click();

  await page.getByLabel("Email").fill("admin1@example.org");

  await page.getByLabel("Email").press("Tab");

  await page.getByLabel("Mot de passe").fill("secret");

  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.locator("#orgEncryptionKey").pressSequentially("plouf");

  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("personne");

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(page).toHaveURL(/http:\/\/localhost:8090\/person\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/);

  await page.getByText("Création réussie !").click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await expect(page).toHaveURL(
    /http:\/\/localhost:8090\/person\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\?tab=Dossier\+M%C3%A9dical/i
  );

  await page.getByRole("button", { name: "Ajouter une consultation" }).click();
  await expect(page).toHaveURL(
    /http:\/\/localhost:8090\/person\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\?tab=Dossier\+M%C3%A9dical/
  );

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("consult abc");

  await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");

  await page.getByLabel("Date prévue").fill(`${dayjs().add(-1, "day").format("YYYY-MM-DD")}T10:00`);

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(page).toHaveURL(
    /http:\/\/localhost:8090\/person\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\?tab=Dossier\+M%C3%A9dical/
  );

  await page.getByRole("button", { name: "Ajouter une consultation" }).click();
  await expect(page).toHaveURL(
    /http:\/\/localhost:8090\/person\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\?tab=Dossier\+M%C3%A9dical/
  );

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("faite");

  await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");

  await page.getByLabel("Date prévue").fill(`${dayjs().add(-2, "day").format("YYYY-MM-DD")}T10:00`);
  await changeReactSelectValue(page, "new-consultation-select-status", "FAITE");

  await expect(page.getByRole("textbox", { name: "Date réalisée" })).toHaveValue(dayjs().format("YYYY-MM-DDTHH:mm"));

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(page).toHaveURL(
    /http:\/\/localhost:8090\/person\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\?tab=Dossier\+M%C3%A9dical/
  );

  await page.getByRole("link", { name: "Agenda" }).click();
  await expect(page).toHaveURL("http://localhost:8090/action?calendarTab=2");

  await page.getByText("<").click();
  await expect(page).toHaveURL(`http://localhost:8090/action?calendarTab=2&calendarDate=${dayjs().add(-1, "day").format("YYYY-MM-DD")}`);

  await page.getByText("consult abc").click();
  await expect(page).toHaveURL(
    /http:\/\/localhost:8090\/action\?calendarTab=2&calendarDate=[0-9]{4}-[0-9]{2}-[0-9]{2}&consultationId=[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
  );

  await page.getByRole("button", { name: "Fermer" }).first().click();
  await expect(page).toHaveURL(`http://localhost:8090/action?calendarTab=2&calendarDate=${dayjs().add(-1, "day").format("YYYY-MM-DD")}`);

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("link", { name: "Agenda" }).click();
  await expect(page).toHaveURL("http://localhost:8090/action?calendarTab=2");

  await page.locator(".action-select-status-filter__multi-value__remove").click();
  await expect(page).toHaveURL("http://localhost:8090/action?calendarTab=2");

  await clickOnEmptyReactSelect(page, "action-select-status-filter", "FAITE");

  await page.locator('[data-test-id="faite"]').getByText("faite").click();
  await expect(page).toHaveURL(
    /http:\/\/localhost:8090\/action\?calendarTab=2&consultationId=[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/
  );

  await page.getByRole("button", { name: "Fermer" }).first().click();
  await expect(page).toHaveURL("http://localhost:8090/action?calendarTab=2");
});
