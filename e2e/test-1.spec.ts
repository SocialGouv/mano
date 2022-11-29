import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {

  await page.locator('input[name="numeroSecuriteSociale"]').click();

  await page.locator('input[name="numeroSecuriteSociale"]').dblclick();

  await page.locator('input[name="numeroSecuriteSociale"]').fill('456');

});