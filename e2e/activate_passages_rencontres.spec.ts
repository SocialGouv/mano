import { test, expect } from "@playwright/test";
import { populate } from "./scripts/populate-db";
import { loginWith, logOut } from "./utils";
import dayjs from "dayjs";

test.beforeAll(async () => {
  await populate();
});
test.setTimeout(120000);

test("test", async ({ page }) => {
  const today = dayjs().format("YYYY-MM-DD");

  /* ************************************************************************* */
  /* ****** PARTIE 1 TEST ADMIN 1 PASSAGE ACTIVE ET RENCONTRE DESACTIVE ****** */
  /* ************************************************************************* */

  await loginWith(page, "admin1@example.org", "secret", "plouf");

  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Passages/rencontres" }).click();
  await page.locator("#passagesEnabled").check();
  await page.locator("#rencontresEnabled").uncheck();

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.getByText("Mise à jour !").click();

  /* ***** accueil ***** */

  await page.getByRole("link", { name: "Accueil" }).click();
  await page.locator(".person-select-and-create-reception__input-container").click();
  await page.locator("#person-select-and-create-reception").press("Home");
  await page.locator("#person-select-and-create-reception").press("Home");
  await page.locator("#person-select-and-create-reception").fill("test1");
  await page.locator("#react-select-5-option-0").click();
  await page.getByText("Nouvelle personne ajoutée !").click();
  await page.getByRole("button", { name: "Passage" }).first().click();
  await page.getByRole("button", { name: "Passage anonyme" }).click();
  // await page.getByText("Passages enregistrés").click();

  /* ***** personnes suvies ***** */

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByText("test1").click();

  await expect(page.getByRole("button", { name: "Passages (1)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Rencontres (0)" })).not.toBeVisible();

  await page.getByRole("button", { name: "Ajouter un passage" }).click();
  await page.getByRole("dialog").getByLabel("Commentaire").fill("test passage");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Passage enregistré !").click();

  /* ***** comptes rendus ***** */

  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await expect(page.getByText("3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Passer les passages en plein écran" }).click();
  await expect(page.getByRole("dialog", { name: "Passages (3)" }).getByText("Nombre de passages anonymes 1passage")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Passages (3)" }).getByText("Nombre de passages non-anonymes 2passages")).toBeVisible();
  await page.getByRole("button", { name: "Ajouter un passage" }).click();
  await page.locator(".person__input-container").click();
  await page.locator("#react-select-persons-option-0").click();
  await page.getByRole("dialog").getByLabel("Commentaire").fill("ajout passage");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Passages enregistrés !").click();

  await page.getByRole("cell", { name: "ajout passage", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Commentaire").fill("ajout passage modification");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Passage mis à jour").click();
  await page.getByText("Fermer").click();

  /* ***** statistiques ***** */

  await page.getByRole("link", { name: "Statistiques" }).click();
  await page.getByRole("button", { name: "Passages" }).click();
  await expect(page.getByText("Nombre de passages ?Non-anonyme375%Anonyme125%Total4100%AnonymeNon-anonyme1 (25%")).toBeVisible();

  await expect(page.getByRole("button", { name: "Rencontres", exact: true })).not.toBeVisible();

  /* ***** delog ***** */

  await logOut(page, "User Admin Test - 1");

  /* ****************************************************************************** */
  /* ****** PARTIE 2 TEST ADMIN 2 RENCONTRES ACTIVEES ET PASSAGES DESACTIVES ****** */
  /* ****************************************************************************** */

  await loginWith(page, "admin2@example.org", "secret", "plouf");

  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Passages/rencontres" }).click();
  await page.locator("#passagesEnabled").uncheck();
  await page.locator("#rencontresEnabled").check();

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.getByText("Mise à jour !").click();

  /* ***** accueil ***** */

  await page.getByRole("link", { name: "Accueil" }).click();

  await expect(page.getByRole("button", { name: "Passage anonyme" })).not.toBeVisible();
  await page.locator(".person-select-and-create-reception__input-container").click();
  await page.locator("#person-select-and-create-reception").fill("testpassage");
  await page.getByText('Créer "testpassage"').click();
  await page.getByText("Nouvelle personne ajoutée !").click();
  await expect(page.getByRole("button", { name: "Passage" })).not.toBeVisible();

  /* ***** personnes suivies ***** */

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("testrencontres");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Rencontres (0)" }).click();

  await expect(page.getByRole("link", { name: "Passages (0)" })).not.toBeVisible();

  await page.getByRole("button", { name: "Ajouter une rencontre" }).click();
  await page.getByRole("dialog").getByLabel("Commentaire").fill("je viens de créer une rencontre");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Rencontre enregistrée").click();
  await page.getByText("je viens de créer une rencontre").first().click();
  await page.getByRole("dialog").getByLabel("Commentaire").fill("je viens de modifier une rencontre");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Rencontre mise à jour").click();
  /* ***** comptes rendus ***** */

  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await expect(page.getByTitle("Rencontres", { exact: true }).getByText("1")).toBeVisible();
  await page.getByRole("button", { name: "Passer les rencontres en plein écran" }).click();
  await page.getByRole("button", { name: "Ajouter une rencontre" }).click();
  await page.getByRole("dialog").getByLabel("Commentaire").fill("test ajoute nouvelle rencontre");
  await page.locator(".person__input-container").click();
  await page.locator("#react-select-persons-option-0").click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByRole("cell", { name: "test ajoute nouvelle rencontre", exact: true }).click();
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Rencontre mise à jour").click();
  await page.getByText("Fermer").click();

  /* ***** statistiques ***** */

  await page.getByRole("link", { name: "Statistiques" }).click();
  await page.getByRole("button", { name: "Rencontres", exact: true }).filter({ hasText: "Rencontres" }).click();
  await page.getByText("Nombre de rencontres ?2").click();

  await expect(page.getByRole("button", { name: "Passages" })).not.toBeVisible();

  await logOut(page, "User Admin Test - 2");

  /* *********************************************************************************** */
  /* ****** PARTIE 3 TEST ADMIN 3 + USER NORMAL RENCONTRES ET PASSAGES DESACTIVES ****** */
  /* *********************************************************************************** */

  await loginWith(page, "admin3@example.org", "secret", "plouf");

  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Passages/rencontres" }).click();
  await page.locator("#passagesEnabled").uncheck();
  await page.locator("#rencontresEnabled").uncheck();

  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.getByText("Mise à jour !").click();

  await logOut(page, "User Admin Test - 3");

  await loginWith(page, "normal3@example.org", "secret", "plouf");

  /* ***** Accueil ***** */

  await page.getByRole("link", { name: "Accueil" }).click();

  await expect(page.getByRole("button", { name: "Passage anonyme" })).not.toBeVisible();
  await page.locator(".person-select-and-create-reception__input-container").click();
  await page.locator("#person-select-and-create-reception").fill("testpassage");
  await page.getByText('Créer "testpassage"').click();
  await page.getByText("Nouvelle personne ajoutée !").click();
  await expect(page.getByRole("button", { name: "Passage" })).not.toBeVisible();

  /* ***** personnes suivies ***** */
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("testrencontrepassage");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await expect(page.getByRole("link", { name: "Passages (0)" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Rencontres (0)" })).not.toBeVisible();

  /* ***** statistiques ***** */

  await page.getByRole("link", { name: "Statistiques" }).click();

  await expect(page.getByRole("button", { name: "Passages", exact: true })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Rencontres", exact: true })).not.toBeVisible();

  await expect(page.getByText("Nombre de passages ?0")).not.toBeVisible();

  await logOut(page, "User Normal Test - 3");

  /* ******************************************************************************** */
  /* ****** PARTIE 4 TEST ADMIN 4 + USER NORMAL RENCONTRES ET PASSAGES ACTIVES ****** */
  /* ******************************************************************************** */

  await loginWith(page, "admin4@example.org", "secret", "plouf");

  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("button", { name: "Passages/rencontres" }).click();
  if (!page.locator("#passagesEnabled").isChecked() || !page.locator("#rencontresEnabled").isChecked()) {
    await page.locator("#passagesEnabled").check();
    await page.locator("#rencontresEnabled").check();
    await page.getByRole("button", { name: "Mettre à jour" }).click();
  }

  /* ***** Personne suivies ***** */
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("testrencontrepassage");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Rencontres (0)" }).click();
  await page.getByRole("button", { name: "Passages (0)" }).click();
  await page.getByRole("button", { name: "Ajouter un passage" }).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Passage enregistré !").click();
  await page.getByRole("button", { name: "Rencontres (0)" }).click();
  await page.getByRole("button", { name: "Ajouter une rencontre" }).click();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Rencontre enregistrée").click();

  /* ***** comptes rendus ***** */
  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await expect(page.getByTitle("Rencontres", { exact: true }).getByText("1")).toBeVisible();
  await expect(page.getByTitle("Passages", { exact: true }).getByText("1")).toBeVisible();

  /* ***** statistiques ***** */

  await page.getByRole("link", { name: "Statistiques" }).click();
  await page.getByRole("button", { name: "Rencontres", exact: true }).filter({ hasText: "Rencontres" }).click();
  await page.getByRole("button", { name: "Passages" }).click();
});
