import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { clickOnEmptyReactSelect, loginWith, logOut } from "./utils";

dayjs.extend(utc);
dayjs.locale("fr");

test.beforeAll(async () => {
  await populate();
});

test("test restricted accesses", async ({ page }) => {
  const person1Name = nanoid();
  const person2Name = nanoid();
  const person3Name = nanoid();
  const person4Name = nanoid();

  await test.step("Admin creates person and medical files", async () => {
    await loginWith(page, "admin1@example.org");

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").fill("1");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").fill("2");

    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person/92bdc89e-347f-4081-bab8-91743dcebca4");

    await page.getByText("Création réussie !").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

    await page.getByLabel("Nom").click();

    await page.getByLabel("Nom").fill("3");

    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person/005831ac-c2b2-448c-8b4a-8824adc13631");

    await page.getByText("Création réussie !").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();

    await page.getByLabel("Nom").click();

    await page.getByLabel("Nom").fill("4");

    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person/0ff50abc-8fc5-4887-ac55-1cea8c34cafe");

    await page.getByText("Création réussie !").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("cell", { name: "1" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person/9c0a8934-4935-44be-aad9-e4e5781d138d");

    await page.getByRole("button", { name: "Dossier Médical" }).click();

    await page.getByRole("link", { name: "Équipes" }).click();
    await expect(page).toHaveURL("http://localhost:8090/team");

    await page.getByRole("link", { name: "Organisation" }).click();
    await expect(page).toHaveURL("http://localhost:8090/organisation/5f37ac43-555f-4505-8888-5b12223142e8");

    await page.getByRole("button", { name: "Dossier Médical 🧑‍⚕️" }).click();

    await page.getByRole("button", { name: "Ajouter un champ" }).click();

    await page.getByLabel("Nom").click();

    await page.getByLabel("Nom").fill("Multi-champ");

    await page.locator(".form-group > .css-2b097c-container > .css-yk16xz-control > .css-g1d714-ValueContainer").click();

    await page.locator("#react-select-10-option-7").click();

    await page.locator(".form-group > .css-2b097c-container > .css-yk16xz-control > .css-g1d714-ValueContainer").click();

    await page.getByLabel("Choix").fill("choix 1");

    await page.getByLabel("Choix").press("Enter");

    await page.getByLabel("Choix").fill("choix 2");

    await page.getByLabel("Choix").press("Enter");

    await page.getByRole("button", { name: "Enregistrer" }).click();

    await page.getByText("🔍 RechercheAccueilAgendaPersonnes suiviesTerritoiresComptes rendusLieux fréquen").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("cell", { name: "1" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person/9c0a8934-4935-44be-aad9-e4e5781d138d");

    await page.getByRole("button", { name: "Dossier Médical" }).click();

    await page.getByLabel("Numéro de sécurité sociale").click();

    await page.getByLabel("Numéro de sécurité sociale").fill("123");

    await page.getByRole("button", { name: "Mettre à jour" }).nth(1).click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("cell", { name: "2" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person/92bdc89e-347f-4081-bab8-91743dcebca4");

    await page.getByRole("button", { name: "Dossier Médical" }).click();

    await page.getByLabel("Numéro de sécurité sociale").click();

    await page.getByLabel("Numéro de sécurité sociale").fill("456");

    await page.getByRole("button", { name: "Mettre à jour" }).nth(1).click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("cell", { name: "3" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person/005831ac-c2b2-448c-8b4a-8824adc13631");

    await page.getByRole("button", { name: "Dossier Médical" }).click();

    await page.getByText("-- Choisir --").nth(2).click();

    await page.locator("#react-select-custom-2022-11-29T16-08-33-046Z-option-0").click();

    await page.locator(".person-custom-select-custom-2022-11-29T16-08-33-046Z__value-container").click();

    await page.locator("#react-select-custom-2022-11-29T16-08-33-046Z-option-1").click();

    await page.getByRole("button", { name: "Mettre à jour" }).nth(1).click();

    await page.getByRole("link", { name: "Utilisateurs" }).click();
    await expect(page).toHaveURL("http://localhost:8090/user");

    await page.getByRole("button", { name: "User Admin Test - 1" }).click();

    await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL("http://localhost:8090/auth");

    await page.getByLabel("Email").click();

    await page.getByLabel("Email").fill("normal1@example.org");

    await page.getByLabel("Email").press("Tab");

    await page.getByLabel("Mot de passe").fill("secret");

    await page.getByLabel("Mot de passe").press("Enter");

    await page.getByLabel("Clé de chiffrement d'organisation").click();

    await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");

    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("cell", { name: "1" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person/9c0a8934-4935-44be-aad9-e4e5781d138d");

    await page.getByRole("button", { name: "Fusionner avec un autre dossier" }).click();

    await page.locator(".person-to-merge-with-select__value-container").click();

    await page.locator("#react-select-20-option-0").click();

    await page.getByRole("button", { name: "Close" }).click();

    await page.getByRole("button", { name: "User Normal Test - 1" }).click();

    await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL("http://localhost:8090/auth");

    await page.getByLabel("Email").click();

    await page.getByLabel("Email").fill("admin1@example.org");

    await page.getByLabel("Email").press("Tab");

    await page.getByLabel("Mot de passe").fill("secret");

    await page.getByRole("button", { name: "Se connecter" }).click();

    await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");

    await page.getByLabel("Clé de chiffrement d'organisation").press("Enter");
    await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("cell", { name: "2" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person/92bdc89e-347f-4081-bab8-91743dcebca4");

    await page.getByRole("button", { name: "Dossier Médical" }).click();

    await page.locator('#root div:has-text("RésuméDossier MédicalLieux fréquentésHistorique")').nth(4).click();

    await page.getByText("Retour").click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("cell", { name: "1" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person/9c0a8934-4935-44be-aad9-e4e5781d138d");

    await page.getByRole("button", { name: "Dossier Médical" }).click();

    await page.getByText("Retour").click();
    await expect(page).toHaveURL("http://localhost:8090/person");
  });
});
