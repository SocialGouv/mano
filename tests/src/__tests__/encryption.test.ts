import "expect-puppeteer";
import { connectWith, useEncryptedOrga } from "../utils";

jest.setTimeout(20000);

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

  // it("should allow a user to login with encryption key", async () => {
  //   await useEncryptedOrga();
  //   await connectWith("adminEncrypted@example.org", "secret", "plouf")
  //   await new Promise((resolve) => setTimeout(resolve, 3000));
  //   await expect(page).toMatch("Encrypted orga");
  // });

  it("should allow an admin to change the encryption key", async () => {
    await useEncryptedOrga();
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    await expect(page).toMatch("Encrypted orga", { timeout: 4000 });
    /* Create a person */
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await expect(page).toClick("a", { text: "Personnes suivies" });
    await expect(page).toMatch("Personnes suivies par l'organisation", { timeout: 4000 });
    await expect(page).toClick("button", { text: "Créer une nouvelle personne" });
    await expect(page).toFill('input[name="name"]', "Ma première personne");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await expect(page).toMatch("Dossier de Ma première personne");
    /* Change the key */
    await expect(page).toClick("a", { text: "Organisation" });
    await expect(page).toMatch("Changer la clé de chiffrement");
    await expect(page).toClick("button", { text: "Changer la clé de chiffrement" });
    await expect(page).toMatch("Confirmez la clé de chiffrement");
    await expect(page).toFill('input[name="encryptionKey"]', "plaf");
    await expect(page).toFill('input[name="encryptionKeyConfirm"]', "plaf");
    await expect(page).toClick("button[type=submit]", { text: "Changer la clé de chiffrement" });
    await page.reload();
    await connectWith("adminEncrypted@example.org", "secret", "plaf");
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await expect(page).toMatch("Encrypted orga");
    /* Check the person */
    await expect(page).toClick("a", { text: "Personnes suivies" });
    await expect(page).toMatch("Ma première personne");
  });
});
