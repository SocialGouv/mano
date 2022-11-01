import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.getByText('-- Choisir une collaboration --').click();

  await page.getByLabel('Collaboration').fill('une collab');

  await page.getByText(/Créer\s+"une\s+collab"/).click();

  await page.getByRole('button', { name: 'close' }).click();

  await page.getByRole('button', { name: 'Mettre à jour' }).click();

  await page.getByRole('button', { name: 'close' }).click();

  await page.getByRole('button', { name: 'Ajouter une description' }).click();

  await page.getByLabel('Description').click();

  await page.getByLabel('Description').fill('une description');

  await page.getByRole('button', { name: 'Enregistrer' }).click();

});