import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.locator('[data-test-id="faite"]').getByText('faite').click();
  await expect(page).toHaveURL('http://localhost:8090/person/6345e0b2-7698-4048-acc9-1fefb60bfc42?tab=Dossier+M%C3%A9dical&consultationId=ac45ae43-bb45-44d5-a656-842f90b076b7');

  await page.getByRole('button', { name: 'Fermer la fenêtre de modification de la consultation' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/6345e0b2-7698-4048-acc9-1fefb60bfc42?tab=Dossier+M%C3%A9dical&consultationId=null');

  await page.getByRole('link', { name: 'Comptes rendus' }).click();
  await expect(page).toHaveURL('http://localhost:8090/report');

  await page.getByRole('button', { name: '2022-12-04' }).click();
  await expect(page).toHaveURL('http://localhost:8090/report/2022-12-04?reportsTeam=%5B%22f15d19eb-0103-4a52-9489-0a9ec0c21ca8%22%5D');

  await page.getByText('Consultations créées (2)').click();

  await page.locator('[data-test-id="faite"]').getByText('faite').click();
  await expect(page).toHaveURL('http://localhost:8090/person/6345e0b2-7698-4048-acc9-1fefb60bfc42?tab=Dossier+M%C3%A9dical&consultationId=ac45ae43-bb45-44d5-a656-842f90b076b7');

  await page.getByRole('button', { name: 'Fermer la fenêtre de modification de la consultation' }).click();
  await expect(page).toHaveURL('http://localhost:8090/report/2022-12-04?reportsTeam=%5B%22f15d19eb-0103-4a52-9489-0a9ec0c21ca8%22%5D');

  await page.getByText('Consultations créées (2)').click();

  await page.locator('[data-test-id="consult"]').getByText('consult').click();
  await expect(page).toHaveURL('http://localhost:8090/person/6345e0b2-7698-4048-acc9-1fefb60bfc42?tab=Dossier+M%C3%A9dical&consultationId=6b7be493-3f0b-40a9-8153-689e9b6f4c4d');

  await page.getByRole('button', { name: 'Fermer la fenêtre de modification de la consultation' }).click();
  await expect(page).toHaveURL('http://localhost:8090/report/2022-12-04?reportsTeam=%5B%22f15d19eb-0103-4a52-9489-0a9ec0c21ca8%22%5D');

  await page.getByText('Consultations faites (1)').click();

  await page.locator('[data-test-id="faite"]').getByText('faite').click();
  await expect(page).toHaveURL('http://localhost:8090/person/6345e0b2-7698-4048-acc9-1fefb60bfc42?tab=Dossier+M%C3%A9dical&consultationId=ac45ae43-bb45-44d5-a656-842f90b076b7');

  await page.getByRole('button', { name: 'Fermer la fenêtre de modification de la consultation' }).click();
  await expect(page).toHaveURL('http://localhost:8090/person/6345e0b2-7698-4048-acc9-1fefb60bfc42?tab=Dossier+M%C3%A9dical&consultationId=null');

});