import "expect-puppeteer";
import { connectWith, useEncryptedOrga } from "../utils";

describe("Encryption", () => {
  beforeEach(async () => {
    await page.goto("http://localhost:8090/auth");
    try {
      await page.waitForSelector("#email", { timeout: 1500 });
    } catch (e) {
      await expect(page).toClick("button[type=button]", {
        text: "Me connecter avec un autre utilisateur",
      });
    }
  });

  it("should allow a user to login with encryption key", async () => {
    await useEncryptedOrga();
    await connectWith("adminEncrypted@example.org", "secret", "plouf")
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await expect(page).toMatch("Encrypted orga");
  });

  it("should allow an admin to change the encryption key", async () => {
    await useEncryptedOrga();
    await connectWith("adminEncrypted@example.org", "secret", "plouf")
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await expect(page).toMatch("Encrypted orga");

  });
});
