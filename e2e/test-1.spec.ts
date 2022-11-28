import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.goto('http://localhost:8090/');

  await page.goto('http://localhost:8090/auth');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('normal1@example.org');

  await page.getByLabel('Email').press('Tab');

  await page.getByLabel('Mot de passe').fill('secret');

  await page.getByLabel('Mot de passe').press('Enter');

  await page.getByLabel('Clé de chiffrement d\'organisation').fill('plouf');

  await page.getByLabel('Clé de chiffrement d\'organisation').press('Enter');
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('button', { name: 'Créer une nouvelle personne' }).click();

  await page.getByRole('dialog').getByRole('document').locator('div:has-text("Nom")').nth(4).click();

  await page.getByLabel('Nom').fill('person2');

  await page.getByRole('button', { name: 'Sauvegarder' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/17752bf5-0be4-422b-b85e-9d5f84721f39');

  await page.getByRole('button', { name: 'Fusionner avec un autre dossier' }).click();

  await page.getByText('-- Choisir --').click();

  await page.locator('#react-select-7-option-0').click();

  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'Fusionner' }).click();

});