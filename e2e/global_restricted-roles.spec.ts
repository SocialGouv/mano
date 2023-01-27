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
test.setTimeout(90000);
test("test restricted accesses", async ({ page }) => {
  const person1Name = nanoid();
  const person2Name = nanoid();
  const consult1 = nanoid();
  const consult1visibleByMe = nanoid();
  const treatment1 = nanoid();

  await loginWith(page, "admin1@example.org");

  await test.step("Admin creates person and medical files", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").fill(person1Name);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await page.getByRole("button", { name: "Modifier" }).click();
    await page.locator(".person-select-gender__value-container").click();
    await page.locator("#react-select-gender-option-1").click();
    await page.getByLabel("Date de naissance").fill("11/11/2001");
    await page.getByLabel("En rue depuis le").fill("12/11/2001");
    await page.getByLabel("Suivi(e) depuis le / Créé(e) le").fill("13/11/2001");
    await page.getByLabel("Téléphone").fill("123456");
    await page.getByLabel("Description").fill("cool man");
    await page.getByLabel("Personne très vulnérable, ou ayant besoin d'une attention particulière").check();
    await page.getByRole("dialog").getByText("Informations sociales").click();
    // locator('.person-custom-select-situation-personnelle__control')
    await clickOnEmptyReactSelect(page, "person-custom-select-situation-personnelle", "Homme isolé");
    await page.getByRole("dialog").getByText("Informations médicales").click();
    await clickOnEmptyReactSelect(page, "person-select-healthInsurances", "Régime Général");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Mis à jour !").click();

    await page.getByRole("button", { name: "Dossier Médical" }).click();

    await page.getByRole("button", { name: "🩺 Ajouter une consultation" }).click();
    await page.getByLabel("Nom").fill(consult1);
    await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");
    await page.getByRole("button", { name: "Sauvegarder" }).click();

    await page.getByRole("button", { name: "🩺 Ajouter une consultation" }).click();
    await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");
    await page.getByLabel("Nom").fill(consult1visibleByMe);
    await page.getByLabel("Seulement visible par moi").check();
    await page.getByRole("button", { name: "Sauvegarder" }).click();

    await page.getByRole("button", { name: "💊 Ajouter un traitement" }).click();
    await page.getByPlaceholder("Amoxicilline").fill(treatment1);
    await page.getByPlaceholder("1mg").fill("1");
    await page.getByPlaceholder("1 fois par jour").fill("1");
    await page.getByPlaceholder("Angine").fill("1");
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Traitement créé !").click();
  });

  await test.step("Admin healthcare professional can see everything", async () => {
    await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();

    await page.getByRole("link", { name: "Agenda" }).click();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1} Médicale` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) })).toBeVisible();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    const personId = await page.locator("tr", { has: page.getByRole("cell", { name: person1Name }) }).getAttribute("data-test-id");
    await expect(
      page
        .locator(`[data-test-id="${personId}"]`)
        .getByRole("button", { name: "Personne très vulnérable, ou ayant besoin d'une attention particulière" })
    ).toBeVisible();
    await page.getByRole("cell", { name: person1Name }).click();
    await expect(page).toHaveURL(`http://localhost:8090/person/${personId}`);
    await expect(page.getByText("Genre : Homme")).toBeVisible();
    await expect(page.locator('i:has-text("11/11/2001")')).toBeVisible();
    await expect(page.getByText("En rue depuis le : 12/11/2001")).toBeVisible();
    await expect(page.getByText("Suivi·e depuis le : 13/11/2001")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Commentaires" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Informations sociales" })).toBeVisible();
    await expect(page.getByText("cool man")).toBeVisible();
    await expect(page.getByText("Homme isolé")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Informations Médicales" })).toBeVisible();
    await expect(page.getByText("Régime Général")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dossier Médical" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Lieux fréquentés (0)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Historique" })).toBeVisible();
    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await expect(page.getByText("Régime Général").nth(1)).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${treatment1} 1` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1} Médicale` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) })).toBeVisible();
    await page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) }).click();
    await page.getByRole("button", { name: "Annuler" }).click();

    await expect(page.getByRole("link", { name: "Territoires" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Comptes rendus" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Structures" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Soliguide" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Statistiques" })).toBeVisible();
    await page.getByRole("link", { name: "Statistiques" }).click();
    await expect(page.getByRole("list").getByText("Général")).toBeVisible();
    await expect(page.getByRole("list").getByText("Accueil")).toBeVisible();
    await expect(page.getByRole("list").getByText("Actions")).toBeVisible();
    await expect(page.getByRole("list").getByText("Personnes créées", { exact: true })).toBeVisible();
    await expect(page.getByRole("list").getByText("Personnes suivies", { exact: true })).toBeVisible();
    await expect(page.getByRole("list").getByText("Passages")).toBeVisible();
    await expect(page.getByRole("list").getByText("Rencontres")).toBeVisible();
    await expect(page.getByRole("list").getByText("Observations")).toBeVisible();
    await expect(page.getByRole("list").getByText("Comptes-rendus")).toBeVisible();
    await expect(page.getByRole("list").getByText("Consultations")).toBeVisible();
    await expect(page.getByRole("list").getByText("Dossiers médicaux des personnes suivies", { exact: true })).toBeVisible();
    await expect(page.getByRole("list").getByText("Dossiers médicaux des personnes créées", { exact: true })).toBeVisible();

    await expect(page.getByRole("link", { name: "Organisation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Équipes" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Utilisateurs" })).toBeVisible();
  });

  await logOut(page, "User Admin Test - 1");
  await loginWith(page, "healthprofessional1@example.org");

  await test.step("Normal healthcare professional can see everything except my consultation", async () => {
    await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();

    await page.getByRole("link", { name: "Agenda" }).click();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1} Médicale` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) })).not.toBeVisible();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    const personId = await page.locator("tr", { has: page.getByRole("cell", { name: person1Name }) }).getAttribute("data-test-id");
    await expect(
      page
        .locator(`[data-test-id="${personId}"]`)
        .getByRole("button", { name: "Personne très vulnérable, ou ayant besoin d'une attention particulière" })
    ).toBeVisible();
    await page.getByRole("cell", { name: person1Name }).click();
    await expect(page).toHaveURL(`http://localhost:8090/person/${personId}`);
    await expect(page.getByText("Genre : Homme")).toBeVisible();
    await expect(page.locator('i:has-text("11/11/2001")')).toBeVisible();
    await expect(page.getByText("En rue depuis le : 12/11/2001")).toBeVisible();
    await expect(page.getByText("Suivi·e depuis le : 13/11/2001")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Commentaires" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Informations sociales" })).toBeVisible();
    await expect(page.getByText("cool man")).toBeVisible();
    await expect(page.getByText("Homme isolé")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Informations Médicales" })).toBeVisible();
    await expect(page.getByText("Régime Général")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dossier Médical" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Lieux fréquentés (0)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Historique" })).toBeVisible();
    await page.getByRole("button", { name: "Dossier Médical" }).click();
    await expect(page.getByText("Régime Général").nth(1)).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${treatment1} 1` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1} Médicale` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) })).not.toBeVisible();
    await expect(page.locator("tr.tw-cursor-not-allowed", { has: page.getByText("Seulement visible parUser Admin Test - 1") })).toBeVisible();
    await expect(page.getByRole("link", { name: "Territoires" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Comptes rendus" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Structures" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Soliguide" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Statistiques" })).toBeVisible();
    await page.getByRole("link", { name: "Statistiques" }).click();
    await expect(page.getByRole("list").getByText("Général")).toBeVisible();
    await expect(page.getByRole("list").getByText("Accueil")).toBeVisible();
    await expect(page.getByRole("list").getByText("Actions")).toBeVisible();
    await expect(page.getByRole("list").getByText("Personnes créées", { exact: true })).toBeVisible();
    await expect(page.getByRole("list").getByText("Personnes suivies", { exact: true })).toBeVisible();
    await expect(page.getByRole("list").getByText("Passages")).toBeVisible();
    await expect(page.getByRole("list").getByText("Rencontres")).toBeVisible();
    await expect(page.getByRole("list").getByText("Observations")).toBeVisible();
    await expect(page.getByRole("list").getByText("Comptes-rendus")).toBeVisible();
    await expect(page.getByRole("list").getByText("Consultations")).toBeVisible();
    await expect(page.getByRole("list").getByText("Dossiers médicaux des personnes suivies", { exact: true })).toBeVisible();
    await expect(page.getByRole("list").getByText("Dossiers médicaux des personnes créées", { exact: true })).toBeVisible();

    await expect(page.getByRole("link", { name: "Organisation" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Équipes" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Utilisateurs" })).not.toBeVisible();
  });

  await logOut(page, "User Health Professional Test - 1");
  await loginWith(page, "normal1@example.org");

  await test.step("Normal user can see everything not related to health", async () => {
    await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();

    await page.getByRole("link", { name: "Agenda" }).click();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1} Médicale` }) })).not.toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) })).not.toBeVisible();
    await expect(page.locator("tr.tw-cursor-not-allowed", { has: page.getByText("Seulement visible parUser Admin Test - 1") })).not.toBeVisible();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    const personId = await page.locator("tr", { has: page.getByRole("cell", { name: person1Name }) }).getAttribute("data-test-id");
    await expect(
      page
        .locator(`[data-test-id="${personId}"]`)
        .getByRole("button", { name: "Personne très vulnérable, ou ayant besoin d'une attention particulière" })
    ).toBeVisible();
    await page.getByRole("cell", { name: person1Name }).click();
    await expect(page).toHaveURL(`http://localhost:8090/person/${personId}`);
    await expect(page.getByText("Genre : Homme")).toBeVisible();
    await expect(page.locator('i:has-text("11/11/2001")')).toBeVisible();
    await expect(page.getByText("En rue depuis le : 12/11/2001")).toBeVisible();
    await expect(page.getByText("Suivi·e depuis le : 13/11/2001")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Commentaires" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Informations sociales" })).toBeVisible();
    await expect(page.getByText("cool man")).toBeVisible();
    await expect(page.getByText("Homme isolé")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Informations Médicales" })).toBeVisible();
    await expect(page.getByText("Régime Général")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Dossier Médical" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Lieux fréquentés (0)" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Historique" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Territoires" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Comptes rendus" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Structures" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Soliguide" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Statistiques" })).toBeVisible();
    await page.getByRole("link", { name: "Statistiques" }).click();
    await expect(page.getByRole("list").getByText("Général")).toBeVisible();
    await expect(page.getByRole("list").getByText("Accueil")).toBeVisible();
    await expect(page.getByRole("list").getByText("Actions")).toBeVisible();
    await expect(page.getByRole("list").getByText("Personnes créées", { exact: true })).toBeVisible();
    await expect(page.getByRole("list").getByText("Personnes suivies", { exact: true })).toBeVisible();
    await expect(page.getByRole("list").getByText("Passages")).toBeVisible();
    await expect(page.getByRole("list").getByText("Rencontres")).toBeVisible();
    await expect(page.getByRole("list").getByText("Observations")).toBeVisible();
    await expect(page.getByRole("list").getByText("Comptes-rendus")).toBeVisible();
    await expect(page.getByRole("list").getByText("Consultations")).not.toBeVisible();
    await expect(page.getByRole("list").getByText("Dossiers médicaux des personnes suivies", { exact: true })).not.toBeVisible();
    await expect(page.getByRole("list").getByText("Dossiers médicaux des personnes créées", { exact: true })).not.toBeVisible();

    await expect(page.getByRole("link", { name: "Organisation" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Équipes" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Utilisateurs" })).not.toBeVisible();
  });

  await logOut(page, "User Normal Test - 1");
  await loginWith(page, "restricted1@example.org");

  await test.step("Restricted user can see not so many things", async () => {
    await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Agenda" })).not.toBeVisible();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    const personId = await page.locator("tr", { has: page.getByRole("cell", { name: person1Name }) }).getAttribute("data-test-id");
    await expect(
      page
        .locator(`[data-test-id="${personId}"]`)
        .getByRole("button", { name: "Personne très vulnérable, ou ayant besoin d'une attention particulière" })
    ).toBeVisible();
    await page.getByRole("cell", { name: person1Name }).click();
    await expect(page).toHaveURL(`http://localhost:8090/person/${personId}`);
    await expect(page.getByText("Genre : Homme")).toBeVisible();
    await expect(page.locator('i:has-text("11/11/2001")')).toBeVisible();
    await expect(page.getByText("En rue depuis le : 12/11/2001")).toBeVisible();
    await expect(page.getByText("Suivi·e depuis le : 13/11/2001")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Commentaires" })).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Informations sociales" })).not.toBeVisible();
    await expect(page.getByText("cool man")).not.toBeVisible();
    await expect(page.getByText("Homme isolé")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Informations Médicales" })).not.toBeVisible();
    await expect(page.getByText("Régime Général")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Documents" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Dossier Médical" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Lieux fréquentés (0)" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Historique" })).not.toBeVisible();

    await expect(page.getByRole("link", { name: "Territoires" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Comptes rendus" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Structures" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Soliguide" })).not.toBeVisible();

    await expect(page.getByRole("link", { name: "Statistiques" })).not.toBeVisible();

    await expect(page.getByRole("link", { name: "Organisation" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Équipes" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Utilisateurs" })).not.toBeVisible();
  });

  await logOut(page, "User Restricted Test - 1");
  await loginWith(page, "normal1@example.org");

  await test.step("Merge persons", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").click();
    await page.getByLabel("Nom").fill(person2Name);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();

    await page.getByRole("button", { name: "Fusionner avec un autre dossier" }).click();
    await clickOnEmptyReactSelect(page, "person-to-merge-with-select", person1Name);

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.getByRole("dialog").getByRole("button", { name: "Fusionner" }).click();
    await page.getByText("Fusion réussie !").click();
  });

  await logOut(page, "User Normal Test - 1");
  await loginWith(page, "admin1@example.org");

  await test.step("Admin healthcare professional can see everything", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    const personId = await page.locator("tr", { has: page.getByRole("cell", { name: person2Name }) }).getAttribute("data-test-id");
    await expect(
      page
        .locator(`[data-test-id="${personId}"]`)
        .getByRole("button", { name: "Personne très vulnérable, ou ayant besoin d'une attention particulière" })
    ).toBeVisible();
    await page.getByRole("cell", { name: person2Name }).click();

    await expect(page).toHaveURL(`http://localhost:8090/person/${personId}`);

    await expect(page.getByText("Genre : Homme")).toBeVisible();
    await expect(page.locator('i:has-text("11/11/2001")')).toBeVisible();
    await expect(page.getByText("En rue depuis le : 12/11/2001")).toBeVisible();
    await expect(page.getByText(`Suivi·e depuis le : ${dayjs().format("DD/MM/YYYY")}`)).toBeVisible();

    await page.getByRole("button", { name: "Dossier Médical" }).click();

    await expect(page.getByText("Régime Général").nth(1)).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${treatment1} 1` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1} Médicale` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) })).toBeVisible();
    await expect(page.locator("tr.tw-cursor-not-allowed", { has: page.getByText("Seulement visible parUser Admin Test - 1") })).not.toBeVisible();
    await page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) }).click();
    await page.getByRole("button", { name: "Annuler" }).click();

    await page.getByRole("link", { name: "Agenda" }).click();

    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1} Médicale` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) })).toBeVisible();
    await expect(page.locator("tr.tw-cursor-not-allowed", { has: page.getByText("Seulement visible parUser Admin Test - 1") })).not.toBeVisible();
  });

  await logOut(page, "User Admin Test - 1");
  await loginWith(page, "healthprofessional1@example.org");

  await test.step("Normal healthcare professional can see everything except my consultation", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");

    const personId = await page.locator("tr", { has: page.getByRole("cell", { name: person2Name }) }).getAttribute("data-test-id");
    await expect(
      page
        .locator(`[data-test-id="${personId}"]`)
        .getByRole("button", { name: "Personne très vulnérable, ou ayant besoin d'une attention particulière" })
    ).toBeVisible();
    await page.getByRole("cell", { name: person2Name }).click();

    await expect(page).toHaveURL(`http://localhost:8090/person/${personId}`);

    await expect(page.getByText("Genre : Homme")).toBeVisible();
    await expect(page.locator('i:has-text("11/11/2001")')).toBeVisible();
    await expect(page.getByText(`Suivi·e depuis le : ${dayjs().format("DD/MM/YYYY")}`)).toBeVisible();
    await expect(page.getByText("En rue depuis le : 12/11/2001")).toBeVisible();

    await page.getByRole("button", { name: "Dossier Médical" }).click();

    await expect(page.getByText("Régime Général").nth(1)).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${treatment1} 1` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1} Médicale` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) })).not.toBeVisible();
    await expect(page.locator("tr.tw-cursor-not-allowed", { has: page.getByText("Seulement visible parUser Admin Test - 1") })).toBeVisible();

    await page.getByRole("link", { name: "Agenda" }).click();

    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1} Médicale` }) })).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: `${consult1visibleByMe} Médicale` }) })).not.toBeVisible();
    await expect(page.locator("tr.tw-cursor-not-allowed", { has: page.getByText("Seulement visible parUser Admin Test - 1") })).toBeVisible();
  });
});
