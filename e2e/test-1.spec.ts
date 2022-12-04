import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.goto('http://localhost:8090/auth');

  await page.getByLabel('Email').click();

  await page.getByLabel('Email').fill('admin1@example.org');

  await page.getByLabel('Email').press('Tab');

  await page.getByLabel('Mot de passe').fill('secret');

  await page.getByRole('button', { name: 'Se connecter' }).click();

  await page.getByLabel('Clé de chiffrement d\'organisation').fill('plouf');

  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL('http://localhost:8090/reception?calendarTab=2');

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('button', { name: 'Créer une nouvelle personne' }).click();

  await page.getByLabel('Nom').click();

  await page.getByLabel('Nom').fill('personne');

  await page.getByRole('button', { name: 'Sauvegarder' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/2df88272-d21b-403b-bac8-f794659290be');

  await page.getByRole('button', { name: '＋' }).first().click();

  await page.getByLabel('Nom de l\'action').fill('pas faite encore');

  await page.getByRole('button', { name: 'Sauvegarder' }).click();

  await page.getByText('Création réussie !').click();

  await page.getByRole('link', { name: 'Agenda' }).click();
  await expect(page).toHaveURL('http://localhost:8090/action?calendarTab=2');

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('cell', { name: 'personne' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/2df88272-d21b-403b-bac8-f794659290be');

  await page.getByText('dimanche 4 décembre 2022A FAIREpas faite encoreTeam Test - 1').click();
  await expect(page).toHaveURL('http://localhost:8090/action/c096ee6c-25df-408b-821b-873f75388a95');

  await page.getByLabel('À faire le').click();

  await page.getByLabel('À faire le').press('ArrowDown');

  await page.getByLabel('À faire le').click();

  await page.getByLabel('À faire le').press('ArrowDown');

  await page.getByRole('option', { name: 'Choose dimanche 4 décembre 2022' }).press('ArrowUp');

  await page.getByText('À faire lePrevious MonthNext Monthnovembre 2022lumamejevesadi3112345678910111213').click();

  await page.getByRole('button', { name: 'Previous Month' }).click();

  await page.getByRole('option', { name: 'Choose jeudi 3 novembre 2022' }).click();

  await page.getByLabel('À faire le').click();

  await page.getByRole('button', { name: 'Next Month' }).click();

  await page.getByRole('option', { name: 'Choose samedi 3 décembre 2022' }).click();

  await page.getByRole('button', { name: 'Mettre à jour' }).click();

  await page.getByText('Mise à jour !').click();

  await page.getByRole('link', { name: 'Agenda' }).click();
  await expect(page).toHaveURL('http://localhost:8090/action?calendarTab=2');

  await page.getByText('<').click();
  await expect(page).toHaveURL('http://localhost:8090/action?calendarTab=2&calendarDate=2022-12-03');

  await page.getByText('pas faite encore').click();
  await expect(page).toHaveURL('http://localhost:8090/action/c096ee6c-25df-408b-821b-873f75388a95');

  await page.locator('.update-action-select-status__value-container').click();

  await page.locator('#react-select-13-option-1').click();

  await page.getByRole('button', { name: 'Mettre à jour' }).click();

  await page.getByText('Mise à jour !').click();

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('cell', { name: 'personne' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/2df88272-d21b-403b-bac8-f794659290be');

  await page.getByRole('button', { name: 'Dossier Médical' }).click();

  await page.getByRole('button', { name: '🩺 Ajouter une consultation' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/2df88272-d21b-403b-bac8-f794659290be?consultationId=e7bc70bf-53fc-4b7b-a259-e7f21d74539f');

  await page.getByLabel('Nom').click();

  await page.getByLabel('Nom').fill('consult');

  await page.getByRole('textbox', { name: 'Date' }).click();

  await page.getByRole('option', { name: 'Choose samedi 3 décembre 2022' }).click();

  await page.getByRole('button', { name: 'Sauvegarder' }).click();

  await page.getByText('Choisissez le type de consultation').click();

  await page.locator('#react-select-type-option-0').click();

  await page.getByRole('button', { name: 'Sauvegarder' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/2df88272-d21b-403b-bac8-f794659290be?consultationId=null');

  await page.getByRole('link', { name: 'Agenda' }).click();
  await expect(page).toHaveURL('http://localhost:8090/action?calendarTab=2');

  await page.getByText('<').click();
  await expect(page).toHaveURL('http://localhost:8090/action?calendarTab=2&calendarDate=2022-12-03');

  await page.locator('[data-test-id="consult"] div:has-text("Médicale")').click();
  await expect(page).toHaveURL('http://localhost:8090/person/2df88272-d21b-403b-bac8-f794659290be?tab=dossier+m%C3%A9dical&consultationId=515f5dd4-bd29-41c1-a63a-619ee490498c');

  await page.getByRole('link', { name: 'Agenda' }).click();
  await expect(page).toHaveURL('http://localhost:8090/action?calendarTab=2');

  await page.getByText('Hier (1)').click();
  await expect(page).toHaveURL('http://localhost:8090/action?calendarTab=1');

  await page.getByText('consult').click();
  await expect(page).toHaveURL('http://localhost:8090/person/2df88272-d21b-403b-bac8-f794659290be?tab=dossier+m%C3%A9dical&consultationId=515f5dd4-bd29-41c1-a63a-619ee490498c');

});