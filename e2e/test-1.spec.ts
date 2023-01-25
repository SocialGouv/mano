import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByRole('complementary', { name: 'Choix de l\'équipe et menu déroulant pour le Profil' }).locator('div:has-text("1")').nth(2).click();

  await page.getByRole('button', { name: 'Fermer' }).click();

  await page.getByText('TCc4PB4XCr3qK1Yo6UYrm').click();
  await expect(page).toHaveURL('http://localhost:8090/person/29487c15-0574-4805-aeda-157cacd9486b');

  await page.getByRole('button', { name: 'Ajouter un commentaire' }).click();

  await page.getByRole('textbox', { name: 'Commentaire' }).click();

  await page.getByRole('textbox', { name: 'Commentaire' }).fill('commentaire prioritaire pour une personne');

  await page.getByLabel('Commentaire prioritaire Ce commentaire sera mis en avant par rapport aux autres').check();

  await page.getByRole('button', { name: 'Sauvegarder' }).click();

  await page.getByText('Commentaire enregistré').click();

  await page.getByRole('button', { name: 'Fermer' }).click();

  await page.getByRole('link', { name: 'Agenda' }).click();
  await expect(page).toHaveURL('http://localhost:8090/action?calendarTab=2');

});