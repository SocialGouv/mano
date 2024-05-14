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
  const actionName = "Nouvelle action";

  await loginWith(page, "admin1@example.org");
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(personName);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Ajouter une action" }).click();
  await page.getByLabel("Nom de l'action").click();
  await page.getByLabel("Nom de l'action").fill(actionName);
  await page.getByRole("button", { name: "Commentaires", exact: true }).click();
  await page.getByRole("dialog", { name: "Ajouter une action" }).getByRole("button", { name: "＋ Ajouter un commentaire" }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Commentaire intégré");
  await page.getByText("Commentaire prioritaire Ce commentaire sera mis en avant par rapport aux autres").click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByText("Commentaire intégré").click();
  await page.getByRole("dialog", { name: "Commentaire" }).getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Commentaire", { exact: true }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Commentaire intégré modifié");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByRole("button", { name: "Ajouter un commentaire" }).click();
  await page.getByLabel("Commentaire", { exact: true }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Commentaire de personne");
  await page.getByText("Commentaire prioritaire Ce commentaire sera mis en avant par rapport aux autres").click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByText("Commentaire de personne").click();
  await page.getByRole("dialog", { name: "Commentaire" }).getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Commentaire", { exact: true }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Commentaire de personne modifié");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByRole("button", { name: "Passer les commentaires en plein écran" }).click();
  await page.getByRole("dialog", { name: "Commentaires" }).getByText("Commentaire de personne modifié").click();
  await page.getByRole("dialog", { name: "Commentaire", exact: true }).getByRole("button", { name: "Fermer" }).click();
  await page.getByRole("dialog", { name: "Commentaires" }).getByText("Commentaire intégré modifié").click();
  await page.getByRole("dialog", { name: "Commentaire", exact: true }).getByRole("button", { name: "Fermer" }).click();
  await page.getByText("Fermer").click();
  await page.getByText("Nouvelle action").click();
  await page.getByRole("button", { name: "Commentaires (1)" }).click();
  await page
    .getByRole("dialog", { name: "Action: Nouvelle action (créée par User Admin Test - 1)" })
    .getByText("Commentaire intégré modifié")
    .click();
  await page.getByRole("dialog", { name: "Commentaire" }).getByRole("button", { name: "Fermer" }).click();
  await page.getByRole("button", { name: "＋ Ajouter un commentaire" }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Nouveau commentaire d'ation");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire ajouté !").click();
  await page
    .getByRole("dialog", { name: "Action: Nouvelle action (créée par User Admin Test - 1)" })
    .getByText("Nouveau commentaire d'ation")
    .click();
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByRole("button", { name: "Annuler" }).click();
  await page.getByRole("button", { name: "Informations", exact: true }).click();
  await page.getByText("Fermer").click();
  await new Promise((r) => setTimeout(r, 1000));
  await page.getByText("Nouveau commentaire d'ation").click();
  await page.getByRole("dialog", { name: "Commentaire" }).getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Commentaire", { exact: true }).fill("Nouveau commentaire d'action");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire enregistré").click();
});
