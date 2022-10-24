import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("https://github.com/login");
  await page.getByLabel("User Name").fill("user");
  await page.getByLabel("Password").fill("password");
  await page.getByText("Sign in").click();
  // Save signed-in state to 'storageState.json'.
  await page.context().storageState({ path: "storageState.json" });
  await browser.close();
}

export default globalSetup;
