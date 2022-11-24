import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { changeReactSelectValue, clickOnEmptyReactSelect } from "./utils";

dayjs.extend(utc);
dayjs.locale("fr");

test("Merge persons ans download documents", async ({ page }) => {
  // Always use a new items
  const person1Name = nanoid();
  const person2Name = nanoid();

  await test.step("Log in", async () => {
    await page.goto("http://localhost:8090/auth");
    await page.getByLabel("Email").click();
    await page.getByLabel("Email").fill("admin5@example.org");
    await page.getByLabel("Mot de passe").click();
    await page.getByLabel("Mot de passe").fill("secret");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");
  });

  await test.step("Create persons and upload files", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").click();
    await page.getByLabel("Nom").fill(person1Name);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
    await page.locator("label[aria-label='Ajouter un document']").setInputFiles("e2e/files-to-upload/image-1.jpg");
    await page.getByText("image-1.jpg").click();
    const [download] = await Promise.all([
      // Start waiting for the download
      page.waitForEvent("download"),
      // Perform the action that initiates download
      await page.getByRole("button", { name: "Télécharger" }).click(),
    ]);
    const downloadPath1 = await download.path();
    expect(downloadPath1).toBe("image-1.jpg");

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").click();
    await page.getByLabel("Nom").fill(person2Name);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
    await page.locator("label[aria-label='Ajouter un document']").setInputFiles("e2e/files-to-upload/image-2.jpg");
    await page.getByText("image-2.jpg").click();
    await page.getByRole("button", { name: "Télécharger" }).click();
  });
  /*
  await test.step("Upload file", async () => {});

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("person4");

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person/73c56b5d-1585-4b9b-a419-fcb7cf349e34");

  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

  await page.getByLabel("Nom").click();

  await page.getByLabel("Nom").fill("person5");

  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person/ef461dfb-fb8e-4208-be2e-cca7ae29b665");

  await page.locator('label:has-text("＋")').click();

  await page
    .locator('body:has-text("Création réussie !Orga Test - 1Team Test - 1User Test - 1User Test - 1 - adminBe")')
    .setInputFiles("Toggl_Track_summary_report_2020-01-01_2020-12-31.pdf");

  await page.getByRole("button", { name: "Fusionner avec un autre dossier" }).click();

  await page.locator(".person-to-merge-with-select__value-container").click();

  await page.locator("#react-select-8-option-1").click();

  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Fusionner" }).click();

  await page.getByRole("cell", { name: "image.png mercredi 23 novembre 2022 17:08 Créé par User Test - 1" }).click();

  await page.getByRole("button", { name: "Télécharger" }).click(); */
});
