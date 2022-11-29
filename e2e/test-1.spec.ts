import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.getByRole('button', { name: 'User Admin Test - 5' }).click();

  await page.getByRole('menuitem', { name: 'Se déconnecter' }).click();
  await expect(page).toHaveURL('http://localhost:8090/auth');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('admin5@example.org');

  await page.getByLabel('Email').press('Tab');

  await page.getByLabel('Mot de passe').fill('secret');

  await page.getByRole('button', { name: 'Se connecter' }).click();

  await page.getByLabel('Clé de chiffrement d\'organisation').fill('plouf');

  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('button', { name: 'User Admin Test - 5' }).click();

  await page.getByRole('menuitem', { name: 'Se déconnecter et supprimer toute trace de mon passage' }).click();
  await expect(page).toHaveURL('http://localhost:8090/auth');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('admin5@example.org');

  await page.getByLabel('Mot de passe').click();

  await page.getByLabel('Mot de passe').fill('mano');

  await page.getByLabel('Mot de passe').press('Meta+a');

  await page.getByLabel('Mot de passe').fill('secret');

  await page.getByRole('button', { name: 'Se connecter' }).click();

  await page.getByLabel('Clé de chiffrement d\'organisation').fill('plouf');

  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('button', { name: 'User Admin Test - 5' }).click();

  await page.getByRole('menuitem', { name: 'Se déconnecter et supprimer toute trace de mon passage' }).click();
  await expect(page).toHaveURL('http://localhost:8090/auth');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('admin5@example.org');

  await page.getByLabel('Email').press('Tab');

  await page.getByLabel('Mot de passe').fill('secret');

  await page.getByRole('button', { name: 'Se connecter' }).click();

  await page.getByLabel('Clé de chiffrement d\'organisation').fill('plouf');

  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

});