import { Page } from "@playwright/test";

export default async function reactSelect(
  page: Page,
  name: string,
  text: string
) {
  await page.locator(`.person-select-${name}__placeholder`).click();
  await page
    .locator(`.person-select-${name}__menu`)
    .getByText(text, { exact: true })
    .click();
}
