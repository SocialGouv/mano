import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.getByRole('button', { name: 'User Test - 10' }).click();

  await page.getByRole('menuitem', { name: 'Se déconnecter' }).click();
  await expect(page).toHaveURL('http://localhost:8090/auth');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('admin11@example.org');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('admin11@example.or');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('admin9@example.org');

  await page.getByLabel('Email').press('Tab');

  await page.getByLabel('Mot de passe').fill('secret');

  await page.getByLabel('Mot de passe').press('Enter');

  await page.getByLabel('Clé de chiffrement d\'organisation').fill('plouf');

  await page.getByLabel('Clé de chiffrement d\'organisation').press('Enter');
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.locator('[id="Café-add"]').click({
    clickCount: 4
  });

  await page.locator('[id="Café-add"]').click({
    clickCount: 4
  });

  await page.locator('[id="Café-add"]').click({
    clickCount: 6
  });

  await page.getByRole('link', { name: 'Statistiques' }).click();
  await expect(page).toHaveURL('http://localhost:8090/stats');

  await page.getByRole('button', { name: 'Entre... et le...' }).click();

  await page.getByRole('button', { name: 'Aujourd\'hui' }).click();

  await page.getByRole('list').getByText('Accueil').click();

  await page.getByRole('link', { name: 'Accueil' }).click();
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.locator('.person-select-and-create-reception__value-container').click();

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('link', { name: 'Accueil' }).click();
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.locator('.person-select-and-create-reception__value-container').click();

  await page.locator('#person-select-and-create-reception').fill('personne 1');

  await page.getByText(/Créer\s+"personne\s+1"/).click();
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2&persons=4aafc785-1da2-433d-9cdc-c526fd4154a2');

  await page.locator('.person-select-and-create-reception__value-container').click();

  await page.locator('#person-select-and-create-reception').fill('personne 2');

  await page.locator('#react-select-20-option-0').click();
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2&persons=4aafc785-1da2-433d-9cdc-c526fd4154a2%2C5b55dcb0-8be3-4891-b2a4-88e8a6da840f');

  await page.getByRole('button', { name: 'Passage' }).click();

  await page.getByRole('link', { name: 'Statistiques' }).click();
  await expect(page).toHaveURL('http://localhost:8090/stats');

  await page.getByRole('list').getByText('Accueil').click();

  await page.getByRole('link', { name: 'Comptes rendus' }).click();
  await expect(page).toHaveURL('http://localhost:8090/report');

  await page.getByRole('button', { name: '2022-11-16' }).click();
  await expect(page).toHaveURL('http://localhost:8090/report/2022-11-16?reportsTeam=%5B%226ca57247-eb43-4915-affb-71fcb68493d2%22%5D');

  await page.getByRole('navigation', { name: 'Navigation dans les catégories du compte-rendu' }).getByText('Accueil').click();

  await page.getByText('Passages (2)').click();

  await page.getByText('Personnes créées (2)').click();

});