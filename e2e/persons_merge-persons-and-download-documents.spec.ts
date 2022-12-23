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

test("Merge persons", async ({ page }) => {
  // Always use a new items
  const person1Name = nanoid();
  const person2Name = nanoid();

  let person1DocumentLink: string | null = null;
  let person2DocumentLink: string | null = null;

  await loginWith(page, "admin5@example.org");

  await test.step("Create persons and upload files", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").click();
    await page.getByLabel("Nom").fill(person1Name);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
    await page.locator("label[aria-label='Ajouter un document']").setInputFiles("e2e/files-to-upload/image-1.jpg");
    await page.getByText("Document ajouté !").click();
    person1DocumentLink = await page.locator("tr[aria-label='Document image-1.jpg']").getAttribute("data-test-id");

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").click();
    await page.getByLabel("Nom").fill(person2Name);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
    await page.locator("label[aria-label='Ajouter un document']").setInputFiles("e2e/files-to-upload/image-2.jpg");
    await page.getByText("Document ajouté !").click();
    person2DocumentLink = await page.locator("tr[aria-label='Document image-2.jpg']").getAttribute("data-test-id");
  });

  await test.step("Merge persons", async () => {
    await page.getByRole("button", { name: "Fusionner avec un autre dossier" }).click();
    await clickOnEmptyReactSelect(page, "person-to-merge-with-select", person1Name);

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole("button", { name: "Fusionner", exact: true }).click();
    await page.getByText("Fusion réussie !").click();

    await expect(page.locator(`data-test-id=${person1DocumentLink}`)).toBeVisible();
    await expect(page.locator(`data-test-id=${person2DocumentLink}`)).toBeVisible();
  });
});
