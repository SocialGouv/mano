import { test, expect } from "@playwright/test";
import dayjs from "dayjs";
import { populate } from "./scripts/populate-db";
import { clickOnEmptyReactSelect, loginWith, logOut } from "./utils";

test.beforeAll(async () => {
  await populate();
});

test("test", async ({ page }) => {
  await loginWith(page, "admin8@example.org");

  // On ne peut pas utiliser la date à laquelle on a fait le test car le test est exécuté à une date différente.
  // Donc pour les rapports 2023-03-18 est potentiellement une date qui n'est plus accessible.
  const today = dayjs().format("YYYY-MM-DD");
  // Pour avoir un autre jour c'est un peu plus compliqué car il ne faut pas que ça bug le dernier jour du mois si on met le lendemain
  // Si demain est le mois suivant, on prend la date du début du mois actuel
  const anotherDay =
    dayjs().add(1, "day").month() === dayjs().month() ? dayjs().add(1, "day").format("YYYY-MM-DD") : dayjs().startOf("month").format("YYYY-MM-DD");

  // Admin : creation personne/action/passage/rencontre/commentaire

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("testrestrict");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Ajouter une action" }).click();
  await page.getByLabel("Nom de l'action").fill("actionrestrictasupprimer");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Ajouter une action" }).click();
  await page.getByLabel("Description").click();
  await page.getByLabel("Description").fill("descriptionanepasvoir");
  await page.getByLabel("Nom de l'action").click();
  await page.getByLabel("Nom de l'action").fill("Action2");
  await page.getByLabel("Commentaire (optionnel)").click();
  await page.getByLabel("Commentaire (optionnel)").fill("commentaireanepasvoir");
  await page.getByLabel("Commentaire (optionnel)").click();
  await page.getByLabel("Commentaire (optionnel)").fill("commentaireanepasvoir ");
  await page.getByLabel("Commentaire (optionnel)").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Ajouter un commentaire" }).click();
  await page.getByRole("textbox", { name: "Commentaire" }).fill("commenatire non visible par un restricted");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByRole("button", { name: "Ajouter un commentaire" }).click();
  await page.getByRole("textbox", { name: "Commentaire" }).click();
  await page.getByRole("textbox", { name: "Commentaire" }).fill("idem meme si il est prioritaire");
  await page.getByLabel("Commentaire prioritaire Ce commentaire sera mis en avant par rapport aux autres").check();
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByRole("button", { name: "Ajouter un passage" }).click();
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("passage a voir par restricted");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Passage enregistré").click();
  await page.getByRole("button", { name: "Rencontres (0)" }).click();
  await page.getByRole("button", { name: "Ajouter une rencontre" }).click();
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("idem");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Rencontre enregistrée").click();

  // menu de navigation visible
  await expect(page.getByRole("link", { name: "Utilisateurs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Équipes" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Organisation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Statistiques" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Soliguide" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Structures" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Comptes rendus" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Personnes suivies" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Territoires" })).toBeVisible(); // ok
  await expect(page.getByRole("link", { name: "Agenda" })).toBeVisible(); // ok
  await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible(); // ok

  await page.getByRole("link", { name: "Agenda" }).click();
  await page.getByText("Action2").click();
  await page.getByLabel("Description").click();
  await page.getByRole("button", { name: "Ajouter un commentaire" }).click();
  await page.getByRole("textbox", { name: "Commentaire" }).fill("commentaire a ne pas voir");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Commentaire ajouté !").click();
  await page.getByText("Retour").click();

  // création des territoires
  await page.getByRole("link", { name: "Accueil" }).click();
  await page.getByRole("link", { name: "Territoires" }).click();
  await page.getByRole("button", { name: "Créer un nouveau territoire" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("nouveauterritoire");
  await page.getByLabel("Périmètre").click();
  await clickOnEmptyReactSelect(page, "territory-select-types", "Lieu de deal");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Nouvelle observation" }).click();
  await page.getByLabel("Nombre de personnes non connues hommes rencontrées").click();
  await page.getByLabel("Nombre de personnes non connues hommes rencontrées").fill("3");
  await page.getByLabel("Nombre de personnes non connues femmes rencontrées").click();
  await page.getByLabel("Nombre de personnes non connues femmes rencontrées").fill("4");
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("commentaire");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("button", { name: "Nouvelle observation" }).click();
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("pouvoir supprimer");
  await page.locator(".observation-custom-select-présence-policière__input-container").click();
  await page.locator(".observation-custom-select-présence-policière__input-container").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("link", { name: "Organisation" }).click();
  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await page.getByRole("button", { name: anotherDay }).click();
  await page.getByText("Observations (0)").click();
  await page.getByRole("link", { name: "Territoires" }).click();
  await page.getByText("nouveauterritoire").click();
  await page.getByRole("button", { name: "Nouvelle observation" }).click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await page.getByRole("button", { name: today }).click();
  await page.getByText("Observations (3)").click();

  await page.getByRole("link", { name: "Accueil" }).click();

  await logOut(page, "User Admin Test - 8");

  await loginWith(page, "restricted8@example.org");

  // menu navigation non visible pour restricted
  await expect(page.getByRole("link", { name: "Utilisateurs" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Équipes" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Organisation" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Statistiques" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Soliguide" })).not.toBeVisible();
  await expect(page.getByRole("link", { name: "Structures" })).not.toBeVisible();

  // menu navigation visible pour restricted
  await expect(page.getByRole("link", { name: "Comptes rendus" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Personnes suivies" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Territoires" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Agenda" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Accueil" })).toBeVisible();

  // test sur les actions restricted
  await page.getByRole("link", { name: "Accueil" }).click();
  await page.getByText("Action2").click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("Action");

  // à ne pas voir concernant les actions
  await expect(page.getByLabel("Description")).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Commentaires" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "supprimer" })).not.toBeVisible();
  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.getByText("Mise à jour !").click();
  await page.getByText("Retour").click();
  await page.getByRole("button", { name: "Action" }).click();
  await page.getByLabel("Nom de l'action").fill("pouvoirajouteruneaction");
  await clickOnEmptyReactSelect(page, "create-action-person-select", "testrestrict");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByText("testrestrict").click();
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Autres pseudos").click();
  await page.getByLabel("Autres pseudos").fill("ajouterdesinfos");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mis à jour !").click();
  await page.getByText("pouvoirajouteruneaction").click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("pouvoirajouteruneactio");
  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await page.getByText("Mise à jour !").click();

  await page.getByText("Retour").click();

  // personnes suivies
  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await page.getByText("testrestrict").click();

  await expect(page.getByRole("heading", { name: "Informations sociales" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Informations médicales" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Informations administratives" })).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Commentaires (2)" })).not.toBeVisible();

  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Autres pseudos").click();
  await page.getByLabel("Autres pseudos").fill("modifier");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mis à jour !").click();

  //test sur les passages
  await page.getByRole("button", { name: "Ajouter un passage" }).click();
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("pouvoir ajouter des passage avec commentaires");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Passage enregistré").click();
  await page.getByText("passage a voir par restricted").click();
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("peut modifier le passage");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Passage mis à jour").click();

  await page.getByRole("link", { name: "Territoires" }).click();
  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await page.getByRole("button", { name: anotherDay }).click();

  // test sur les territoires
  await page.getByRole("link", { name: "Territoires" }).click();
  await page.getByText("nouveauterritoire").click();
  page.once("dialog", (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole("button", { name: "Supprimer l'observation" }).nth(1).click();
  await page.getByRole("button", { name: "Nouvelle observation" }).click();
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("ajout d'une observation");
  await page.getByLabel("Nombre de personnes non connues femmes rencontrées").click();
  await page.getByLabel("Nombre de personnes non connues femmes rencontrées").fill("4");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();
  await page.getByText("Nombre de personnes non connues hommes rencontrées: 3Nombre de personnes non con").click();
  await page.getByRole("dialog").click();
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("modifier une observation");
  await page.getByLabel("Nombre de personnes non connues hommes rencontrées").click();
  await page.getByLabel("Nombre de personnes non connues hommes rencontrées").fill("2");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Observation mise à jour").click();

  // test sur les comptes rendus
  await page.getByRole("link", { name: "Comptes rendus" }).click();
  await page.getByRole("button", { name: today }).click();
  await page.getByText("Observations (4)").click();
  await page.getByRole("button", { name: "Ajouter une observation" }).click();
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("test");
  await page.getByLabel("Nombre de personnes non connues femmes rencontrées").click();
  await page.getByLabel("Nombre de personnes non connues femmes rencontrées").fill("3");
  await page.locator(".observation-select-territory__input-container").click();
  await page.locator("#react-select-place-option-0").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await page.getByRole("link", { name: "Accueil" }).click();

  await logOut(page, "User Restricted Test - 8");
});
