import "expect-puppeteer";
import { useSuperAdminAndOrga } from "../utils";

describe("Authentication page", () => {
  beforeEach(async () => {
    await page.goto("http://localhost:8090/auth");
    try {
      await page.waitForSelector("#email", { timeout: 1500 });
    } catch (e) {
      await expect(page).toClick("button[type=button]", {
        text: "Me connecter avec un autre utilisateur",
      });
      await expect(page).toMatch("Bienvenue !");
    }
  });

  it("should deny users to with wrong credentials", async () => {
    await useSuperAdminAndOrga();

    // Wrong email and password
    await expect(page).toFill("#email", "wrong@example.org");
    await expect(page).toFill("#password", "wrong");
    await expect(page).toClick("button[type=submit]");
    await expect(page).toMatch("E-mail ou mot de passe incorrect");

    // Wrong password
    await expect(page).toFill("#email", "superadmin@example.org");
    await expect(page).toFill("#password", "wrong");
    await expect(page).toClick("button[type=submit]");
    await expect(page).toMatch("E-mail ou mot de passe incorrect");

    // Wrong email
    await expect(page).toFill("#email", "superadmin@example.org");
    await expect(page).toFill("#password", "secret");
    await expect(page).toClick("button[type=submit]");
    await expect(page).toMatch("E-mail ou mot de passe incorrect");
  });

  it("should allow users to with correct credentials", async () => {
    await useSuperAdminAndOrga();
    await expect(page).toFill("#email", "superadmin@example.org");
    await expect(page).toFill("#password", "secret");
    await expect(page).toClick("button[type=submit]");
    await expect(page).toMatch("Support");
  });
});
