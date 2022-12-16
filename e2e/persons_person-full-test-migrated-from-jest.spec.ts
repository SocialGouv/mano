import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, loginWith, logOut } from "./utils";

test.beforeAll(async () => {
  await populate();
});
test.setTimeout(45000);
test("test", async ({ page }) => {
  const personName = nanoid();

  await loginWith(page, "admin1@example.org");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill(personName);
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await page.getByText(personName).click();
  await page.getByRole("main").getByText("Team Test - 1").click();
  await page.getByRole("button", { name: "Modifier" }).click();
  await page.getByLabel("Autres pseudos").click();
  await page.getByLabel("Autres pseudos").fill("test pseudo");
  await clickOnEmptyReactSelect(page, "person-custom-select-genre", "Femme");
  await page.getByLabel("Date de naissance").click();
  await page.getByLabel("Date de naissance").fill("11/11/2001");
  await page.getByLabel("Date de naissance").press("Enter");
  await page.getByLabel("En rue depuis le").click();
  await page.getByLabel("En rue depuis le").fill("11/11/2001");
  await page.getByLabel("En rue depuis le").press("Enter");
  await page.getByLabel("Suivi(e) depuis le / Créé(e) le").click();
  await page.getByLabel("Suivi(e) depuis le / Créé(e) le").press("Meta+a");
  await page.getByLabel("Suivi(e) depuis le / Créé(e) le").fill("12/11/2001");
  await page.getByLabel("Suivi(e) depuis le / Créé(e) le").press("Enter");
  await page.getByLabel("Téléphone").click();
  await page.getByLabel("Téléphone").fill("010203040506");
  await page.getByLabel("Description").click();
  await page.getByLabel("Description").fill("Description");
  await page.getByText("Personne très vulnérable, ou ayant besoin d'une attention particulière").click();
  await page.getByText("+").first().click();
  await page.locator(".person-custom-select-situation-personnelle__value-container").click();
  await page.getByLabel("Structure de suivi social").click();
  await page.getByLabel("Structure de suivi social").fill("social");
  await page.locator(".person-custom-select-avec-animaux__value-container").click();
  await page.locator("#react-select-hasAnimal-option-0").click();
  await page.locator(".person-custom-select-hebergement__value-container").click();
  await page.locator("#react-select-address-option-0").click();
  await clickOnEmptyReactSelect(page, "person-custom-select-type-dhebergement", "Chez un tiers");
  await clickOnEmptyReactSelect(page, "person-custom-select-nationalite", "Hors UE");
  await clickOnEmptyReactSelect(page, "person-custom-select-emploi", "CDI");
  await clickOnEmptyReactSelect(page, "person-custom-select-ressources", "ARE");
  await clickOnEmptyReactSelect(page, "person-custom-select-motif-de-la-situation-en-rue", "Départ du pays d'origine");
  await page.getByRole("dialog").getByText("Informations médicales").click();
  await clickOnEmptyReactSelect(page, "person-custom-select-couvertures-medicales", "AME");
  await page.getByLabel("Structure de suivi médical").fill("dedede");
  await clickOnEmptyReactSelect(page, "person-custom-select-consommations", "Amphétamine/MDMA/Ecstasy");
  await clickOnEmptyReactSelect(page, "person-custom-select-vulnerabilites", "Injecteur");
  await clickOnEmptyReactSelect(page, "person-custom-select-categorie-dantecedents", "Pulmonaire");
  await page.getByLabel("Informations complémentaires (antécédents)").fill("hello ionfo complémentaires");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Mis à jour !").click();
  await page.getByText("Suivi·e depuis le : 12/11/2001").click();
  await page.getByText("En rue depuis le : 11/11/2001").click();
  await page.getByText("Téléphone : 010203040506").click();
  await page.getByText("(test pseudo)").click();
  await page.getByText(personName).click();
  await page.locator('p:has-text("social")').click();
  await page.getByText("Oui").first().click();
  await page.getByText("Hors UE").click();
  await page.getByText("Chez un tiers").click();
  await page.getByText("Oui").nth(1).click();
  await page.getByText("CDI").click();
  await page.getByText("ARE").click();
  await page.getByText("Départ du pays d'origine").click();
  await page.getByText("AME").click();
  await page.getByText("dedede").click();
  await page.getByText("Amphétamine/MDMA/Ecstasy").click();
  await page.getByText("Injecteur").click();
  await page.getByText("Pulmonaire").click();
  await page.getByText("hello ionfo complémentaires").click();
  await page.locator("button[aria-label='Ajouter une action']").click();
  await page.getByLabel("Nom de l'action").click();
  await page.getByLabel("Nom de l'action").fill("hello action");
  await page.getByLabel("Montrer l'heure").check();
  await page.getByLabel("À faire le").fill("11/12/2002");
  //  await page.locator('body:has-text("Orga Test - 1Team Test - 1User Test - 1User Test - 1 - adminBesoin d\'aide ? Donn")').press("Enter");
  await page.getByLabel("Description").click();
  await page.getByLabel("Description").fill("tests description");
  await page.getByText("Action prioritaire Cette action sera mise en avant par rapport aux autres").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Création réussie !").click();

  await page.locator("button[aria-label='Ajouter un commentaire']").click();
  await page.getByRole("textbox", { name: "Commentaire" }).click();
  await page.getByRole("textbox", { name: "Commentaire" }).fill("Premier commentaire");
  await page.getByText("Commentaire prioritaire Ce commentaire sera mis en avant par rapport aux autres").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Commentaire enregistré").click();
  await page.getByText("Premier commentaire").click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Commentaire enregistré").click();

  await page.locator("button[aria-label='Ajouter un passage']").click();
  await page.getByLabel("Date").click();
  await page.getByLabel("Date").fill("10/10/2004");
  await page.getByLabel("Date").press("Enter");
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("hello commentaire passage je veux dire");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Passage enregistré").click();

  await page.getByRole("button", { name: "Rencontres (0)" }).click();
  await page.locator("button[aria-label='Ajouter une rencontre']").click();
  await page.getByLabel("Date").click();
  await page.getByLabel("Date").press("Meta+a");
  await page.getByLabel("Date").fill("09/09/2006");
  await page.getByLabel("Date").press("Enter");
  await page.getByLabel("Commentaire").click();
  await page.getByLabel("Commentaire").fill("BOUM");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByText("Rencontre enregistrée").click();

  await page.getByRole("button", { name: "Dossier Médical" }).click();
  await changeReactSelectValue(page, "person-select-gender", "Homme");
  await page.getByRole("button", { name: "Mettre à jour" }).first().click();
  await page.getByText("Mise à jour effectuée !").click();
  await page.getByLabel("Numéro de sécurité sociale").click();
  await page.getByLabel("Numéro de sécurité sociale").fill("082");
  await page.getByRole("button", { name: "Mettre à jour" }).nth(1).click();
  await page.getByText("Mise à jour effectuée !").click();

  await page.getByRole("button", { name: "💊 Ajouter un traitement" }).click();
  await page.getByPlaceholder("Amoxicilline").click();
  await page.getByPlaceholder("Amoxicilline").fill("hdeyygdeygde");
  await page.getByRole("dialog").getByRole("document").locator('div:has-text("Fréquence")').nth(4).click();
  await page.getByPlaceholder("1 fois par jour").click();
  await page.getByPlaceholder("1 fois par jour").fill("dedede");
  await page.getByPlaceholder("Angine").click();
  await page.getByPlaceholder("Angine").fill("dedededed");
  await page.getByLabel("Date de fin").click();
  await page.getByLabel("Date de fin").fill("11/11/2000");
  await page.getByLabel("Date de fin").press("Enter");
  await page.getByLabel("Date de début").click();
  await page.getByLabel("Date de début").press("Meta+a");
  await page.getByLabel("Date de début").fill("11/11/2009");
  await page.getByLabel("Date de début").press("Enter");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Le dosage est obligatoire").click();
  await page.getByPlaceholder("1mg").click();
  await page.getByPlaceholder("1mg").fill("121212121");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Traitement créé !").click();

  await expect(page.locator('small:has-text("dedededed")')).toBeVisible();
  await page.getByRole("button", { name: "🩺 Ajouter une consultation" }).click();
  await page.getByLabel("Nom").click();
  await page.getByLabel("Nom").fill("AZAZAZAZAZAZAZAZA");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText("Veuillez choisir un type de consultation").click();
  await clickOnEmptyReactSelect(page, "consultation-modal-type", "Médicale");
  await page.getByRole("button", { name: "Sauvegarder" }).click();

  await page.locator('small:has-text("Médicale")').click();
  await page.getByRole("button", { name: "Annuler" }).click();
  await page.getByRole("button", { name: "Lieux fréquentés" }).click();
  await page.getByRole("button", { name: "Historique" }).click();
  await page.locator('[data-test-id="Autres pseudos\\: \\"\\" ➔ \\"test pseudo\\""]').click();
  await page.getByText("Retour").click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByText(personName).click();
  await page.getByText("hello action").click();

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");
  await page.getByRole("cell", { name: personName }).click();
  await page.getByRole("button", { name: "Sortie de file active" }).click();
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.getByText(personName + " est hors de la file active.").click();
  await page.getByText(personName + " est en dehors de la file active, pour le motif suivant : l").click();
  await page.getByRole("button", { name: "Réintégrer dans la file active" }).click();
  await page.getByText(personName + " est dans la file active.").click();
  await page.getByRole("button", { name: "Sortie de file active" }).click();
  await clickOnEmptyReactSelect(page, "person-select-outOfActiveListReasons", "Départ vers autre région");
  await page.getByRole("button", { name: "Sauvegarder" }).click();
  await page.locator(".alert-warning").getByText("Départ vers autre région").click();
  await page.getByText(personName + " est hors de la file active.").click();

  await logOut(page, "User Admin Test - 1");

  await loginWith(page, "normal1@example.org");

  await page.getByRole("link", { name: "Personnes suivies" }).click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByRole("cell", { name: `${personName} Sortie de file active : Départ vers autre région` }).click();
  await page.getByRole("button", { name: "Supprimer" }).click();

  await page.locator('input[name="textToConfirm"]').fill(personName);

  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  await page
    .locator(`div[role="document"]:has-text("Voulez-vous vraiment supprimer la personne ${personName}×Cette opération")`)
    .getByRole("button", { name: "Supprimer" })
    .click();
  await expect(page).toHaveURL("http://localhost:8090/person");

  await page.getByText("Suppression réussie").click();
  await expect(page.locator('div[role="alert"]:has-text("Désolé, une erreur est survenue, l\'équipe technique est prévenue.")')).not.toBeVisible();
});
