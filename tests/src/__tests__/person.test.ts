import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import "expect-puppeteer";
import { setDefaultOptions } from "expect-puppeteer";
import {
  connectWith,
  navigateWithReactRouter,
  useEncryptedOrga,
  scrollDown,
  scrollTop,
  getInputValue,
  getInnerText,
} from "../utils";

dayjs.extend(utc);
dayjs.locale("fr");

jest.setTimeout(60000);
setDefaultOptions({ timeout: 60000 });

describe("Organisation CRUD", () => {
  beforeAll(async () => {
    await useEncryptedOrga();
  });

  it("should be able to create a person", async () => {
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    await expect(page).toMatch("Encrypted Orga", { timeout: 4000 });
    await navigateWithReactRouter("/person");
    await expect(page).toMatch("Personnes suivies par l'organisation");
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", {
      text: "Créer une nouvelle personne",
    });
    await expect(page).toFill('input[name="name"]', "Ma première personne");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Création réussie !");
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Dossier de Ma première personne");
  });

  it("should be able to check tabs for this person", async () => {
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", { text: "Ma première personne" });
    await page.waitForTimeout(1000);
    await scrollTop();
    await expect(page).toClick("a", { text: "Actions (0)" });
    await expect(page).toClick("a", { text: "Lieux (0)" });
    await expect(page).toClick("a", { text: "Commentaires (0)" });
    await expect(page).toClick("a", { text: "Documents (0)" });
  });

  /*
  ACTION CREATION
  */

  it("should add action", async () => {
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Actions (0)" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", { text: "Créer une nouvelle action" });
    await expect(page).toFill("input#create-action-name", "Mon action");
    await expect(page).toClick("input#create-action-team-select");
    await expect(page).toClick("div.create-action-team-select__option");
    await expect(page).toMatch("Encrypted Orga Admin");
    await expect(page).toMatch("Ma première personne");
    await expect(page).toMatch("À FAIRE");
    const dueAt = await getInputValue("input#create-action-dueat");
    expect(dueAt).toBe(dayjs().format("DD/MM/YYYY"));
    await expect(page).toFill(
      "textarea#create-action-description",
      "Une petite description pour la route"
    );
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Création réussie !");
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Mon action");
    await expect(page).toMatch("À FAIRE");
    await expect(page).toMatch("(créée par Encrypted Orga Admin)");
    await expect(page).toMatch("Une petite description pour la route");
    await expect(page).toClick("a", { text: "Retour" });
    await expect(page).toMatch("Dossier de Ma première personne");
    await expect(page).toClick("a", { text: "Commentaires (0)" });
    await expect(page).toClick("a", { text: "Actions (1)" });
    await expect(page).toClick("td", { text: "Mon action" });
    await expect(page).toClick("a", { text: "Retour" });
    await expect(page).toMatch("Mon action");
    await expect(page).toMatch("A FAIRE");
    await expect(page).toMatch("Encrypted Orga Admin");
  });

  /*
  UPDATE PERSON
  */

  it("should update a person", async () => {
    await expect(page).toClick("a", { text: "Résumé" });
    await expect(page).toFill('input[name="otherNames"]', "autre nom");
    await expect(page).toClick("input#person-select-gender");
    await expect(page).toClick("div.person-select-gender__option:nth-of-type(2)");
    await expect(page).toFill("input#person-birthdate", "26/05/1981");
    await page.keyboard.press("Escape");
    await expect(page).toFill("input#person-wanderingAt", "26/04/2005");
    await page.keyboard.press("Escape");
    await expect(page).toFill("input#person-followedSince", "20/04/2019");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(page).toClick("input#person-select-assigned-team");
    await expect(page).toClick("div.person-select-assigned-team__option");
    await expect(page).toClick("input#person-alertness-checkbox");
    await expect(page).toFill('input[name="phone"]', "0123456789");
    await expect(page).toFill('textarea[name="description"]', "Une chic personne");
    await expect(page).toClick("input#person-select-personalSituation");
    await expect(page).toClick("div.person-select-personalSituation__option:nth-of-type(2)");
    await expect(page).toFill('input[name="structureSocial"]', "Une structure sociale");
    await expect(page).toClick("input#person-select-animals");
    await expect(page).toClick("div.person-select-animals__option");
    await expect(page).toClick("input#person-select-address");
    await expect(page).toClick("div.person-select-address__option");
    await expect(page).toClick("input#person-select-addressDetail");
    await expect(page).toClick("div.person-select-addressDetail__option:nth-of-type(4)");
    await expect(page).toClick("input#person-select-nationalitySituation");
    await expect(page).toClick("div.person-select-nationalitySituation__option");
    await expect(page).toClick("input#person-select-employment");
    await expect(page).toClick("div.person-select-employment__option");
    await expect(page).toClick("input#person-select-resources");
    await expect(page).toClick("div.person-select-resources__option");
    await expect(page).toClick("input#person-select-reasons");
    await expect(page).toClick("div.person-select-reasons__option");
    await expect(page).toClick("input#person-select-healthInsurance");
    await expect(page).toClick("div.person-select-healthInsurance__option");
    await expect(page).toClick("input#person-custom-select-consumptions");
    await expect(page).toClick("div.person-custom-select-consumptions__option");
    await expect(page).toFill('input[name="structureMedical"]', "Une structure médicale");
    await expect(page).toFill('textarea[name="caseHistoryDescription"]', "Mon historique médical");
    await expect(page).toClick("button", { text: "Mettre à jour" });
    await expect(page).toMatch("Mis à jour !");
    await expect(page).toClick("div.close-toastr");
  });

  it("should see created person", async () => {
    await navigateWithReactRouter("/person");
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Ma première personne");
  });

  it("should see created person all fields", async () => {
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", { text: "Ma première personne" });
    expect(await getInputValue('input[name="name"]')).toBe("Ma première personne");
    expect(await getInputValue('input[name="otherNames"]')).toBe("autre nom");
    expect(await getInnerText("div.person-select-gender__single-value")).toBe("Homme");
    expect(await getInputValue("input#person-birthdate")).toBe("26/05/1981");
    expect(await getInputValue("input#person-wanderingAt")).toBe("26/04/2005");
    expect(await getInputValue("input#person-followedSince")).toBe("20/04/2019");
    expect(await getInnerText("div.person-select-assigned-team__multi-value__label")).toBe(
      "Encrypted Orga Team"
    );
    expect(
      await page
        .$('input[name="alertness"]')
        .then((input) => input?.getProperty("checked"))
        .then((value) => value?.jsonValue())
    ).toBe(true);
    expect(await getInputValue('input[name="phone"]')).toBe("0123456789");
    expect(await getInputValue('textarea[name="description"]')).toBe("Une chic personne");
    expect(await getInnerText("div.person-select-personalSituation__single-value")).toBe(
      "Homme isolé"
    );
    expect(await getInputValue('input[name="structureSocial"]')).toBe("Une structure sociale");
    expect(await getInnerText("div.person-select-animals__single-value")).toBe("Oui");
    expect(await getInnerText("div.person-select-address__single-value")).toBe("Oui");
    expect(await getInnerText("div.person-select-addressDetail__single-value")).toBe(
      "Mise à l'abri"
    );
    expect(await getInnerText("div.person-select-nationalitySituation__single-value")).toBe(
      "Hors UE"
    );
    expect(await getInnerText("div.person-select-employment__single-value")).toBe("DPH");
    expect(await getInnerText("div.person-select-resources__multi-value__label")).toBe("SANS");
    expect(await getInnerText("div.person-select-reasons__multi-value__label")).toBe(
      "Sortie d'hébergement"
    );
    expect(await getInnerText("div.person-select-healthInsurance__single-value")).toBe("Aucune");
    expect(await getInnerText("div.person-custom-select-consumptions__multi-value__label")).toBe(
      "Alcool"
    );
    expect(await getInputValue('input[name="structureMedical"]')).toBe("Une structure médicale");
    expect(await getInputValue('textarea[name="caseHistoryDescription"]')).toBe(
      "Mon historique médical"
    );
  });

  it("should be able to see the comment for an updated person", async () => {
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Commentaires (1)" });
    await expect(page).toMatch("Changement de situation personnelle:");
    await expect(page).toMatch("Avant: Non renseigné");
    await expect(page).toMatch("Désormais: Homme isolé");
    await expect(page).toMatch("Changement de nationalité:");
    await expect(page).toMatch("Avant: Non renseigné");
    await expect(page).toMatch("Désormais: Hors UE");
    await expect(page).toMatch("Changement de structure de suivi social:");
    await expect(page).toMatch("Avant: Non renseigné");
    await expect(page).toMatch("Désormais: Une structure sociale");
    await expect(page).toMatch("Changement de structure de suivi médical:");
    await expect(page).toMatch("Avant: Non renseigné");
    await expect(page).toMatch("Désormais: Une structure médicale");
    await expect(page).toMatch("Changement d'emploi:");
    await expect(page).toMatch("Avant: Non renseigné");
    await expect(page).toMatch("Désormais: DPH");
    await expect(page).toMatch("Changement d'hébergement:");
    await expect(page).toMatch("Avant: Non renseigné");
    await expect(page).toMatch("Désormais: Mise à l'abri");
    await expect(page).toMatch("Changement de ressources:");
    await expect(page).toMatch("Avant: Non renseigné");
    await expect(page).toMatch("Désormais: SANS");
    await expect(page).toMatch("Changement de couverture médicale:");
    await expect(page).toMatch("Avant: Non renseigné");
    await expect(page).toMatch("Désormais: Aucune");
  });

  /*
  COMMENT CREATION
  */

  it("should be able to create a comment for this person", async () => {
    await expect(page).toClick("a", { text: "Commentaires (1)" });
    await expect(page).toClick("button", { text: "Ajouter un commentaire" });
    await expect(page).toMatch("Créer un commentaire", { timeout: 4000 });
    await expect(page).toFill('textarea[name="comment"]', "Ceci est un commentaire");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Ceci est un commentaire");
  });

  it("should be able to create another comment for this person", async () => {
    await page.waitForTimeout(1000);
    await expect(page).toClick("a", { text: "Commentaires (2)" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", { text: "Ajouter un commentaire" });
    await expect(page).toMatch("Créer un commentaire", { timeout: 4000 });
    await expect(page).toFill('textarea[name="comment"]', "Ceci est un autre commentaire");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Ceci est un commentaire");
    await expect(page).toMatch("Ceci est un autre commentaire");
  });

  /*
  PLACE CREATION
  */

  it("should add a place", async () => {
    await navigateWithReactRouter("/place");
    await page.waitForTimeout(1000);
    await expect(page).toClick("button", { text: "Créer un nouveau lieu fréquenté" });
    await page.waitForTimeout(1000);
    await expect(page).toFill("input#create-place-name", "Mon lieu fréquenté");
    await expect(page).toClick("button#create-place-button");
    await page.waitForTimeout(1000);
    await expect(page).toClick("div.close-toastr");
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", { text: "Ma première personne" });
    // await scrollTop();
    await expect(page).toClick("a", { text: "Lieux (0)" });
    await expect(page).toClick("button", { text: "Ajouter un lieu" });
    await expect(page).toClick("input#add-place-select-place");
    await expect(page).toClick("div.add-place-select-place__option");
    await expect(page).toMatch("Mon lieu fréquenté");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await expect(page).toMatch("Lieu ajouté !");
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Mon lieu fréquenté");
    await expect(page).toMatch("Lieux (1)");
  });

  /*
  RELOAD AND CHECK EVERYTHING IS HERE
  */

  it("should have all the created data showing on reload", async () => {
    await page.goto("http://localhost:8090/auth");
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    await expect(page).toMatch("Encrypted Orga", { timeout: 4000 });
    await navigateWithReactRouter("/person");
    await expect(page).toMatch("Personnes suivies par l'organisation");
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Ma première personne");
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", { text: "Ma première personne" });
    // await scrollTop();
    /* Summary */
    expect(await getInputValue('input[name="name"]')).toBe("Ma première personne");
    expect(await getInputValue('input[name="otherNames"]')).toBe("autre nom");
    expect(await getInnerText("div.person-select-gender__single-value")).toBe("Homme");
    expect(await getInputValue("input#person-birthdate")).toBe("26/05/1981");
    expect(await getInputValue("input#person-wanderingAt")).toBe("26/04/2005");
    expect(await getInputValue("input#person-followedSince")).toBe("20/04/2019");
    expect(await getInnerText("div.person-select-assigned-team__multi-value__label")).toBe(
      "Encrypted Orga Team"
    );
    expect(
      await page
        .$('input[name="alertness"]')
        .then((input) => input?.getProperty("checked"))
        .then((value) => value?.jsonValue())
    ).toBe(true);
    expect(await getInputValue('input[name="phone"]')).toBe("0123456789");
    expect(await getInputValue('textarea[name="description"]')).toBe("Une chic personne");
    expect(await getInnerText("div.person-select-personalSituation__single-value")).toBe(
      "Homme isolé"
    );
    expect(await getInputValue('input[name="structureSocial"]')).toBe("Une structure sociale");
    expect(await getInnerText("div.person-select-animals__single-value")).toBe("Oui");
    expect(await getInnerText("div.person-select-address__single-value")).toBe("Oui");
    expect(await getInnerText("div.person-select-addressDetail__single-value")).toBe(
      "Mise à l'abri"
    );
    expect(await getInnerText("div.person-select-nationalitySituation__single-value")).toBe(
      "Hors UE"
    );
    expect(await getInnerText("div.person-select-employment__single-value")).toBe("DPH");
    expect(await getInnerText("div.person-select-resources__multi-value__label")).toBe("SANS");
    expect(await getInnerText("div.person-select-reasons__multi-value__label")).toBe(
      "Sortie d'hébergement"
    );
    expect(await getInnerText("div.person-select-healthInsurance__single-value")).toBe("Aucune");
    expect(await getInnerText("div.person-custom-select-consumptions__multi-value__label")).toBe(
      "Alcool"
    );
    expect(await getInputValue('input[name="structureMedical"]')).toBe("Une structure médicale");
    expect(await getInputValue('textarea[name="caseHistoryDescription"]')).toBe(
      "Mon historique médical"
    );
    /* Actions */
    await expect(page).toClick("a", { text: "Actions (1)" });
    await expect(page).toMatch("Mon action");
    await expect(page).toMatch("A FAIRE");
    await expect(page).toClick("td", { text: "Mon action" });
    await expect(page).toMatch("Mon action");
    await expect(page).toMatch("À FAIRE");
    await expect(page).toMatch("Une petite description pour la route");
    await expect(page).toClick("a", { text: "Retour" });
    await expect(page).toClick("a", { text: "Documents (0)" });
    /* Comments */
    await expect(page).toClick("a", { text: "Commentaires (3)" });
    await expect(page).toMatch("Ceci est un commentaire");
    await expect(page).toMatch("Ceci est un autre commentaire");
    /* Places */
    await expect(page).toClick("a", { text: "Lieux (1)" });
    await expect(page).toMatch("Mon lieu fréquenté");
  });

  it("should be able to put out of active list", async () => {
    await expect(page).toClick("a", { text: "Résumé" });
    await expect(page).toClick("button", { text: "Sortie de file active" });
    await expect(page).toMatch("Veuillez préciser le motif de sortie");
    await expect(page).toClick("input#person-select-outOfActiveListReason");
    await expect(page).toClick("div.person-select-outOfActiveListReason__option");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await expect(page).toMatch("Mise à jour réussie");
    await expect(page).toClick("div.close-toastr");
    await expect(page).toMatch("Réintégrer dans la file active");
    await scrollTop();
    await expect(page).toMatch(
      "Ma première personne est en dehors de la file active, pour le motif suivant : Relai vers autre structure"
    );
    await expect(page).toClick("a", { text: "Retour" });
    await expect(page).toMatch("Ma première personne");
    await expect(page).toMatch("Sortie de file active : Relai vers autre structure");
  });

  it("should be able to put back in active list", async () => {
    await page.goto("http://localhost:8090/auth");
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    await expect(page).toMatch("Encrypted Orga", { timeout: 4000 });
    await navigateWithReactRouter("/person");
    await expect(page).toMatch("Personnes suivies par l'organisation");
    await page.waitForTimeout(1000);
    await expect(page).toMatch("Ma première personne");
    await expect(page).toClick("td", { text: "Ma première personne" });
    // await scrollTop();
    await expect(page).toMatch(
      "Ma première personne est en dehors de la file active, pour le motif suivant : Relai vers autre structure"
    );
    await expect(page).toClick("button", { text: "Réintégrer dans la file active" });
    await expect(page).toMatch("Mise à jour réussie");
    await expect(page).toClick("div.close-toastr");
  });

  // TODO
  it.skip("can delete person", async () => {
    page.on("dialog", async (alert) => {
      // alert should be close now
      expect(alert.type()).toBe("confirm");
      console.log("AND THERE");
      expect(alert.message()).toBe("Êtes-vous sûr ?");
      console.log("OKLA");
      await alert.accept();
    });
    await expect(page).toClick("button", { text: "Supprimer" });
  });

  // TODO
  it.skip("should have deleted the person and the action", async () => {
    try {
      await expect(page).toMatch("Ma première personne");
    } catch (e) {
      console.log("NOT MATCH");
      console.log(e);
    }
  });

  it("should be able to see the action in reception", async () => {
    await navigateWithReactRouter("/reception");
    await expect(page).toMatch(
      `Accueil du ${dayjs().format("dddd D MMMM YYYY")} de l'équipe Encrypted Orga Team`
    );
    await expect(page).toMatch("Mon action");
  });

  it("should be able to add a passage", async () => {
    await navigateWithReactRouter("/reception");
    await expect(page).toMatch(
      `Accueil du ${dayjs().format("dddd D MMMM YYYY")} de l'équipe Encrypted Orga Team`
    );
    await expect(page).toClick("input#person-select-and-create-reception");
    await expect(page).toClick("div.person-select-and-create-reception__option");
    expect(await getInnerText("div.person-select-and-create-reception__multi-value__label")).toBe(
      "!Ma première personne"
    );
    await expect(page).toClick("button", { text: "Ajouter un passage" });
    await page.waitForTimeout(1000);
    expect(await getInputValue("input#number-of-passages")).toBe("1");
    await navigateWithReactRouter("/person");
    await expect(page).toClick("td", { text: "Ma première personne" });
    await expect(page).toClick("a", { text: "Passages (1)" });
    await expect(page).toMatch("Passage enregistré");
  });
});
