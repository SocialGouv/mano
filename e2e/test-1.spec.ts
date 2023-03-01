import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.getByRole('button', { name: 'Ajouter un type de consultations' }).click();

  await page.getByPlaceholder('Titre du groupe').click();

  await page.getByPlaceholder('Titre du groupe').fill('Infirmier');

  await page.getByRole('button', { name: 'Ajouter' }).click();

  await page.getByText('Type de consultation ajouté').click();

});