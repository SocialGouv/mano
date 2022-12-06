import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.getByRole('link', { name: 'Personnes suivies' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByText('WnnRsr8zo8A2Qp4nfgI4t').click();
  await expect(page).toHaveURL('http://localhost:8090/person/4aa490b6-03f7-4ba1-8018-a30e448152c7');

  await page.getByRole('button', { name: 'Supprimer' }).click();

  await page.locator('p:has-text("WnnRsr8zo8A2Qp4nfgI4t") b').dblclick();

  await page.locator('div[role="dialog"]:has-text("Voulez-vous vraiment supprimer la personne WnnRsr8zo8A2Qp4nfgI4t×Cette opération")').press('Meta+c');

  await page.locator('input[name="textToConfirm"]').click();

  await page.locator('input[name="textToConfirm"]').fill('await page.getByText("Mise à jour effectuée !").click();');

  await page.locator('p:has-text("WnnRsr8zo8A2Qp4nfgI4t")').click();

  await page.locator('input[name="textToConfirm"]').click({
    clickCount: 3
  });

  await page.locator('input[name="textToConfirm"]').fill('WnnRsr8zo8A2Qp4nfgI4t');

  await page.locator('div[role="document"]:has-text("Voulez-vous vraiment supprimer la personne WnnRsr8zo8A2Qp4nfgI4t×Cette opération")').getByRole('button', { name: 'Supprimer' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person');

  await page.getByText('Suppression réussie').click();

});