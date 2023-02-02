import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.getByRole('button', { name: 'Modifier le champ aWeOH24eSL0HiUxgJms7O' }).click();

  await page.getByLabel('Activé pour toute l\'organisation').uncheck();

  await page.locator('.enabledTeams__input-container').click();

  await page.locator('#react-select-name-option-1').click();

  await page.getByRole('button', { name: 'Enregistrer' }).click();

  await page.getByText('Mise à jour !').click();

});