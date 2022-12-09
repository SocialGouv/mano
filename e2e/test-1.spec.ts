import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.getByRole('button', { name: 'Personnes suivies' }).click();

  await page.getByRole('button', { name: 'Ajouter un champ' }).nth(1).click();

  await page.getByLabel('Nom').fill('Champ non utilis');

  await page.getByRole('button', { name: 'Ajouter un champ' }).nth(1).click();

  await page.getByLabel('Nom').fill('Champ utilis');

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('button', { name: 'Créer une nouvelle personne' }).click();

  await page.getByLabel('Nom').click();

  await page.getByLabel('Nom').fill('personne 1');

  await page.getByRole('button', { name: 'Sauvegarder' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/b581defd-4e6d-4f45-9c68-7692e7596b78');

  await page.getByRole('button', { name: '✏️' }).nth(1).click();

  await page.getByLabel('Champ utilisé').click();

  await page.getByLabel('Champ utilisé').fill('plouf');

  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await page.getByText('Mis à jour !').click();

  await page.getByRole('link', { name: 'Organisation' }).click();
  await expect(page).toHaveURL('http://localhost:8090/organisation/3e59399a-c614-4c5c-bbba-6305b1274eee');

  await page.getByRole('button', { name: 'Personnes suivies' }).click();

  await page.locator('[data-test-id="Champ utilisé"]').getByRole('button', { name: 'Modifier le champ' }).click();

  await page.getByText('TypeTexte').click();

  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await page.locator('[data-test-id="Champ non utilisé"]').getByRole('button', { name: 'Modifier le champ' }).click();

  await page.locator('.type__input-container').click();

  await page.locator('#react-select-type-option-1').click();

  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await page.getByText('Mise à jour !').click();

});