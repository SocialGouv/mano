import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.goto('http://localhost:8090/');

  await page.goto('http://localhost:8090/auth');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('admin1@example.org');

  await page.getByLabel('Email').press('Tab');

  await page.getByLabel('Mot de passe').fill('secret');

  await page.getByLabel('Mot de passe').press('Enter');

  await page.getByLabel('Clé de chiffrement d\'organisation').fill('plouf');

  await page.getByLabel('Clé de chiffrement d\'organisation').press('Enter');
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('button', { name: 'Créer une nouvelle personne' }).click();

  await page.getByLabel('Nom').click();

  await page.getByLabel('Nom').fill('person4');

  await page.getByRole('button', { name: 'Sauvegarder' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/73c56b5d-1585-4b9b-a419-fcb7cf349e34');

  await page.locator('label:has-text("＋")').click();

  await page.locator('body:has-text("Orga Test - 1Team Test - 1User Test - 1User Test - 1 - adminBesoin d\'aide ? Donn")').setInputFiles('image.png');

  await page.getByRole('cell', { name: 'image.png mercredi 23 novembre 2022 17:08 Créé par User Test - 1' }).click();

  await page.getByRole('button', { name: 'Télécharger' }).click();

  await page.getByRole('button', { name: 'Créer une nouvelle personne' }).click();

  await page.getByLabel('Nom').click();

  await page.getByLabel('Nom').fill('person5');

  await page.getByRole('button', { name: 'Sauvegarder' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/ef461dfb-fb8e-4208-be2e-cca7ae29b665');

  await page.locator('label:has-text("＋")').click();

  await page.locator('body:has-text("Création réussie !Orga Test - 1Team Test - 1User Test - 1User Test - 1 - adminBe")').setInputFiles('Toggl_Track_summary_report_2020-01-01_2020-12-31.pdf');

  await page.getByRole('button', { name: 'Fusionner avec un autre dossier' }).click();

  await page.locator('.person-to-merge-with-select__value-container').click();

  await page.locator('#react-select-8-option-1').click();

  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'Fusionner' }).click();

  await page.getByRole('cell', { name: 'image.png mercredi 23 novembre 2022 17:08 Créé par User Test - 1' }).click();

  await page.getByRole('button', { name: 'Télécharger' }).click();

});