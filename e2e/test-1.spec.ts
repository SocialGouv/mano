import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.goto('http://localhost:8090/');

  await page.goto('http://localhost:8090/auth');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('admin1@example.org');

  await page.getByLabel('Mot de passe').click();

  await page.getByLabel('Mot de passe').fill('secret');

  await page.getByLabel('Mot de passe').press('Enter');

  await page.getByLabel('Clé de chiffrement d\'organisation').click();

  await page.getByLabel('Clé de chiffrement d\'organisation').fill('plouf');

  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('button', { name: 'Créer une nouvelle personne' }).click();

  await page.getByLabel('Nom').click();

  await page.getByLabel('Nom').fill('person1');

  await page.getByRole('button', { name: 'Sauvegarder' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/27ddbd6a-d0c7-4e70-9262-a381c3223bf1');

  await page.locator('label:has-text("＋")').click();

  await page.locator('body:has-text("Orga Test - 1Team Test - 1User Test - 1User Test - 1 - adminBesoin d\'aide ? Donn")').setInputFiles('image.png');

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('button', { name: 'Créer une nouvelle personne' }).click();

  await page.getByLabel('Nom').click();

  await page.getByLabel('Nom').fill('person2');

  await page.getByRole('button', { name: 'Sauvegarder' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/d5163bd5-355c-419f-a8f8-7650d72037fa');

  await page.locator('label:has-text("＋")').click();

  await page.locator('body:has-text("Création réussie !Orga Test - 1Team Test - 1User Test - 1User Test - 1 - adminBe")').setInputFiles('image (1) (2).png');

  await page.getByRole('button', { name: 'Fusionner avec un autre dossier' }).click();

  await page.getByText('-- Choisir --').click();

  await page.locator('#react-select-8-option-0').click();

  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'Fusionner' }).click();

  await page.getByRole('cell', { name: 'image (1) (2).png mercredi 23 novembre 2022 17:04 Créé par User Test - 1' }).getByText('mercredi 23 novembre 2022 17:04').click();

  await page.getByRole('button', { name: 'Télécharger' }).click();

  await page.getByRole('button', { name: 'Télécharger' }).click();

  await page.locator('body:has-text("Orga Test - 1Team Test - 1User Test - 1User Test - 1 - adminBesoin d\'aide ? Donn")').press('Alt+Meta+^');

  await page.getByText('Loading...Fusionner avec un autre dossierLoading...Sortie de file activeLoading.').click();

  await page.locator('div[role="dialog"]:has-text("Fusionnerperson2avecperson1×person2person1Je garde :Créé(e) parUser Test - 1User")').press('Alt+Meta+^');

  await page.locator('div[role="dialog"]:has-text("Fusionnerperson2avecperson1×person2person1Je garde :Créé(e) parUser Test - 1User")').press('Alt+Meta+^');

  await page.getByRole('button', { name: 'Close' }).click();

});