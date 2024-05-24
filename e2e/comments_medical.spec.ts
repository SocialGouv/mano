import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith, logOut } from "./utils";

dayjs.extend(utc);
dayjs.locale("fr");

test.beforeAll(async () => {
  await populate();
});

test("test", async ({ page }) => {
  const personName = "Manu Chao";

  await loginWith(page, "admin1@example.org");
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(personName);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await page.getByRole("button", { name: "Ajouter une consultation" }).click();
  await page.getByLabel("Nom (facultatif)").fill("Une consultation");
  await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");
  await page.getByRole("button", { name: "Commentaires" }).click();
  await page.getByRole("dialog", { name: "Ajouter une consultation" }).getByRole("button", { name: "＋ Ajouter un commentaire" }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Avec un commentaire avant d'enregistrer");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await new Promise((r) => setTimeout(r, 300)); // time for dialog to close
  await page.getByText("Avec un commentaire avant d'enregistrer").click();
  await page.getByRole("button", { name: "Commentaires (1)" }).click();
  await page
    .getByRole("dialog", { name: "Consultation (créée par User Admin Test - 1)" })
    .getByText("Avec un commentaire avant d'enregistrer")
    .click();
  await page.getByLabel("Commentaire", { exact: true }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Avec un commentaire avant d'enregistrer modifié");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByRole("button", { name: "Fermer" }).first().click();
  await new Promise((r) => setTimeout(r, 300)); // time for dialog to close
  await expect(page.getByText("Avec un commentaire avant d'enregistrer modifié")).toBeVisible();
  await page.getByRole("button", { name: "Passer les consultations en plein écran" }).click();
  await page.getByRole("dialog", { name: "Consultations de Manu Chao (1)" }).getByText("Une consultation- Médicale").click();
  await page.getByRole("button", { name: "Commentaires (1)" }).click();
  await page.getByRole("button", { name: "＋ Ajouter un commentaire" }).click();
  await page.getByLabel("Commentaire", { exact: true }).click();
  // format like: lundi 3 juillet 2023 09:59
  const commentDate = dayjs().format("dddd D MMMM YYYY HH:mm");
  await page.getByLabel("Commentaire", { exact: true }).fill("Un autre commentaire de consultation");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByRole("dialog", { name: "Consultation (créée par User Admin Test - 1)" }).getByText("Fermer").click();
  await page.getByText("Fermer").first().click();
  await page.getByRole("button", { name: "Ajouter un traitement" }).click();
  await page.getByPlaceholder("Amoxicilline").fill("Aspirine");
  await page.getByRole("button", { name: "Commentaires", exact: true }).click();
  await page.getByRole("button", { name: "Informations" }).click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Traitement créé !").click();
  await page.getByRole("button", { name: "Ajouter un traitement" }).click();
  await page.getByPlaceholder("Amoxicilline").click();
  await page.getByPlaceholder("Amoxicilline").fill("Supo");
  await page.getByRole("button", { name: "Commentaires", exact: true }).click();
  await page.getByRole("button", { name: "＋ Ajouter un commentaire" }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Commentaire de traitement avant création");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Traitement créé !").click();
  await page.getByText("Commentaire de traitement avant création").click();
  await page.getByRole("button", { name: "Commentaires (1)" }).click();
  await page
    .getByRole("dialog", { name: "Traitement: Supo (créée par User Admin Test - 1)" })
    .getByText("Commentaire de traitement avant création")
    .click();
  await page.getByLabel("Commentaire", { exact: true }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Commentaire de traitement avant création modifié");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByText("Fermer").click();
  await new Promise((r) => setTimeout(r, 300)); // time for dialog to close
  await page.getByRole("button", { name: "Ajouter un commentaire" }).click();
  await page.getByLabel("Commentaire", { exact: true }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Commentaire de dossier médical");
  await page.getByRole("dialog").getByText("Enregistrer").click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByRole("button", { name: "Traitement", exact: true }).click();
  await page.getByRole("dialog", { name: "Traitement: Supo (créée par User Admin Test - 1)" }).getByText("Supo", { exact: true }).click();
  await page.getByText("Fermer").click();
  await page
    .getByRole("cell", {
      name: `${commentDate} Un autre commentaire de consultation Consultation Créé par User Admin Test - 1 Team Test - 1`,
    })
    .getByRole("button", { name: "Consultation" })
    .click();
  await page.getByRole("dialog", { name: "Consultation (créée par User Admin Test - 1)" }).getByText("Une consultation").click();
  await page.getByText("Fermer").click();
  await page.getByText("Commentaire de dossier médical").click();
  await page.getByRole("dialog", { name: "Commentaire" }).getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Commentaire", { exact: true }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Commentaire de dossier médical modif");
});
