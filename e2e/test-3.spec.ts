import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.getByText('<').click();
  await expect(page).toHaveURL('http://localhost:8090/action?calendarTab=2&calendarDate=2022-12-08');

  await page.getByText('<').click();
  await expect(page).toHaveURL('http://localhost:8090/action?calendarTab=2&calendarDate=2022-12-07');

});