import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.getByRole('link', { name: 'Statistiques' }).click();
  await expect(page).toHaveURL('http://localhost:8090/auth');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('admin10@example.org');

  await page.getByLabel('Email').press('Tab');

  await page.getByLabel('Mot de passe').fill('secret');

  await page.getByLabel('Mot de passe').press('Enter');

  await page.getByLabel('Clé de chiffrement d\'organisation').fill('plouf');

  await page.getByLabel('Clé de chiffrement d\'organisation').press('Enter');
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.getByRole('link', { name: 'Statistiques' }).click();
  await expect(page).toHaveURL('http://localhost:8090/stats');

  await page.getByRole('button', { name: 'Entre... et le...' }).click();

  await page.getByText('RafraichirLoading...Exporter les données en .xlsx').click();

  await page.getByRole('button', { name: 'Entre... et le...' }).click();

  await page.getByText('RafraichirLoading...Exporter les données en .xlsx').click();

  await page.getByRole('button', { name: 'Entre... et le...' }).click();

  await page.getByText('Statistiques globalesTeam Test - 10Entre... et le...Toutes les donnéesAujourd\'hu').click();

  await page.locator('div:has-text("Statistiques globalesTeam Test - 10")').nth(3).click();

  await page.getByText('Entre... et le...Toutes les donnéesAujourd\'huiHierCette semaineLa semaine derniè').click();

  await page.getByText('RafraichirLoading...Exporter les données en .xlsx').click();

  await page.getByRole('button', { name: 'Entre... et le...' }).click();

  await page.getByText('Statistiques globalesTeam Test - 10Entre... et le...Toutes les donnéesAujourd\'hu').click();

  await page.getByRole('button', { name: 'Aujourd\'hui' }).click();

  await page.getByRole('link', { name: 'Lieux fréquentés' }).click();
  await expect(page).toHaveURL('http://localhost:8090/place');

  await page.getByRole('link', { name: 'Statistiques' }).click();
  await expect(page).toHaveURL('http://localhost:8090/stats');

  await page.getByRole('button', { name: 'Entre... et le...' }).click();

  await page.getByRole('button', { name: 'Aujourd\'hui' }).click();

});