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
    console.log("plaf 4 - 1");
    console.log("plaf 4");
    await expect(page).toFill('input[name="name"]', "Ma première personne", { timeout: 2000 });
    console.log("plaf 5");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    console.log("plaf 6");
    await expect(page).toMatch("Création réussie !");
    console.log("plaf 7");
    await expect(page).toClick("div.close-toastr");
    console.log("plaf 8");
    await expect(page).toMatch("Dossier de Ma première personne");
  });

  it("should be able to check tabs for this person", async () => {
    await navigateWithReactRouter("/person");
    console.log("plaf 9");
    await expect(page).toClick("td", { text: "Ma première personne" });
    await page.waitForTimeout(1000);
    await scrollTop();
    console.log("plaf 10");
    await expect(page).toClick("a", { text: "Actions (0)" });
    console.log("plaf 11");
    await expect(page).toClick("a", { text: "Lieux (0)" });
    console.log("plaf 12");
    await expect(page).toClick("a", { text: "Commentaires (0)" });
    console.log("plaf 13");
    await expect(page).toClick("a", { text: "Documents (0)" });
  });

  /*
  ACTION CREATION
  */

  it("should add action", async () => {
    await page.waitForTimeout(1000);
    console.log("plaf 14");
    await expect(page).toClick("a", { text: "Actions (0)" });
    await page.waitForTimeout(1000);
    console.log("plaf 15");
    await expect(page).toClick("button", { text: "Créer une nouvelle action" });
    console.log("plaf 16");
    await expect(page).toFill("input#create-action-name", "Mon action");
    console.log("plaf 17");
    await expect(page).toClick("input#create-action-team-select");
    console.log("plaf 18");
    await expect(page).toClick("div.create-action-team-select__option");
    console.log("plaf 19");
    await expect(page).toMatch("Encrypted Orga Admin");
    console.log("plaf 20");
    await expect(page).toMatch("Ma première personne");
    console.log("plaf 21");
    await expect(page).toMatch("À FAIRE");
    const dueAt = await getInputValue("input#create-action-dueat");
    expect(dueAt).toBe(dayjs().format("DD/MM/YYYY"));
    console.log("plaf 22");
    await expect(page).toFill(
      "textarea#create-action-description",
      "Une petite description pour la route"
    );
    console.log("plaf 23");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    console.log("plaf 24");
    await expect(page).toMatch("Création réussie !");
    console.log("plaf 25");
    await expect(page).toClick("div.close-toastr");
    console.log("plaf 26");
    await expect(page).toMatch("Mon action");
    console.log("plaf 27");
    await expect(page).toMatch("À FAIRE");
    console.log("plaf 28");
    await expect(page).toMatch("(créée par Encrypted Orga Admin)");
    console.log("plaf 29");
    await expect(page).toMatch("Une petite description pour la route");
    console.log("plaf 30");
    await expect(page).toClick("a", { text: "Retour" });
    console.log("plaf 31");
    await expect(page).toMatch("Dossier de Ma première personne");
    console.log("plaf 32");
    await expect(page).toClick("a", { text: "Commentaires (0)" });
    console.log("plaf 33");
    await expect(page).toClick("a", { text: "Actions (1)" });
    console.log("plaf 34");
    await expect(page).toClick("td", { text: "Mon action" });
    console.log("plaf 35");
    await expect(page).toClick("a", { text: "Retour" });
    console.log("plaf 36");
    await expect(page).toMatch("Mon action");
    console.log("plaf 37");
    await expect(page).toMatch("A FAIRE");
    console.log("plaf 38");
    await expect(page).toMatch("Encrypted Orga Admin");
  });

  /*
  UPDATE PERSON
  */

  it("should update a person", async () => {
    console.log("plaf 39");
    await expect(page).toClick("a", { text: "Résumé" });
    console.log("plaf 40");
    await expect(page).toFill('input[name="otherNames"]', "autre nom");
    console.log("plaf 41");
    await expect(page).toClick("input#person-select-gender");
    console.log("plaf 42");
    await expect(page).toClick("div.person-select-gender__option:nth-of-type(2)");
    console.log("plaf 43");
    await expect(page).toFill("input#person-birthdate", "26/05/1981");
    await page.keyboard.press("Escape");
    console.log("plaf 44");
    await expect(page).toFill("input#person-wanderingAt", "26/04/2005");
    await page.keyboard.press("Escape");
    console.log("plaf 45");
    await expect(page).toFill("input#person-followedSince", "20/04/2019");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    console.log("plaf 46");
    await expect(page).toClick("input#person-alertness-checkbox");
    console.log("plaf 47");
    await expect(page).toFill('input[name="phone"]', "0123456789");
    console.log("plaf 48");
    await expect(page).toFill('textarea[name="description"]', "Une chic personne");
    console.log("plaf 49");
    await expect(page).toClick("input#person-select-personalSituation");
    console.log("plaf 50");
    await expect(page).toClick("div.person-select-personalSituation__option:nth-of-type(2)");
    console.log("plaf 51");
    await expect(page).toFill('input[name="structureSocial"]', "Une structure sociale");
    console.log("plaf 52");
    await expect(page).toClick("input#person-select-animals");
    console.log("plaf 53");
    await expect(page).toClick("div.person-select-animals__option");
    console.log("plaf 54");
    await expect(page).toClick("input#person-select-address");
    console.log("plaf 55");
    await expect(page).toClick("div.person-select-address__option");
    console.log("plaf 56");
    await expect(page).toClick("input#person-select-addressDetail");
    console.log("plaf 57");
    await expect(page).toClick("div.person-select-addressDetail__option:nth-of-type(4)");
    console.log("plaf 58");
    await expect(page).toClick("input#person-select-nationalitySituation");
    console.log("plaf 59");
    await expect(page).toClick("div.person-select-nationalitySituation__option");
    console.log("plaf 60");
    await expect(page).toClick("input#person-select-employment");
    console.log("plaf 61");
    await expect(page).toClick("div.person-select-employment__option");
    console.log("plaf 62");
    await expect(page).toClick("input#person-select-resources");
    console.log("plaf 63");
    await expect(page).toClick("div.person-select-resources__option");
    console.log("plaf 64");
    await expect(page).toClick("input#person-select-reasons");
    console.log("plaf 65");
    await expect(page).toClick("div.person-select-reasons__option");
    console.log("plaf 66");
    await expect(page).toClick("input#person-select-healthInsurance");
    console.log("plaf 67");
    await expect(page).toClick("div.person-select-healthInsurance__option");
    console.log("plaf 68");
    await expect(page).toClick("input#person-custom-select-consumptions");
    console.log("plaf 69");
    await expect(page).toClick("div.person-custom-select-consumptions__option");
    console.log("plaf 70");
    await expect(page).toFill('input[name="structureMedical"]', "Une structure médicale");
    console.log("plaf 71");
    await expect(page).toFill('textarea[name="caseHistoryDescription"]', "Mon historique médical");
    console.log("plaf 72");
    await expect(page).toClick("button", { text: "Mettre à jour" });
    console.log("plaf 73");
    await expect(page).toMatch("Mis à jour !");
    console.log("plaf 74");
    await expect(page).toClick("div.close-toastr");
  });

  it("should see created person", async () => {
    await navigateWithReactRouter("/person");
    await page.waitForTimeout(1000);
    console.log("plaf 75");
    await expect(page).toMatch("Ma première personne");
  });

  it("should see created person all fields", async () => {
    await navigateWithReactRouter("/person");
    console.log("plaf 76");
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
    console.log("plaf 77");
    await expect(page).toClick("a", { text: "Commentaires (1)" });
    console.log("plaf 78");
    await expect(page).toMatch("Changement de situation personnelle:");
    console.log("plaf 79");
    await expect(page).toMatch("Avant: Non renseigné");
    console.log("plaf 80");
    await expect(page).toMatch("Désormais: Homme isolé");
    console.log("plaf 81");
    await expect(page).toMatch("Changement de nationalité:");
    console.log("plaf 82");
    await expect(page).toMatch("Avant: Non renseigné");
    console.log("plaf 83");
    await expect(page).toMatch("Désormais: Hors UE");
    console.log("plaf 84");
    await expect(page).toMatch("Changement de structure de suivi social:");
    console.log("plaf 85");
    await expect(page).toMatch("Avant: Non renseigné");
    console.log("plaf 86");
    await expect(page).toMatch("Désormais: Une structure sociale");
    console.log("plaf 87");
    await expect(page).toMatch("Changement de structure de suivi médical:");
    console.log("plaf 88");
    await expect(page).toMatch("Avant: Non renseigné");
    console.log("plaf 89");
    await expect(page).toMatch("Désormais: Une structure médicale");
    console.log("plaf 90");
    await expect(page).toMatch("Changement d'emploi:");
    console.log("plaf 91");
    await expect(page).toMatch("Avant: Non renseigné");
    console.log("plaf 92");
    await expect(page).toMatch("Désormais: DPH");
    console.log("plaf 93");
    await expect(page).toMatch("Changement d'hébergement:");
    console.log("plaf 94");
    await expect(page).toMatch("Avant: Non renseigné");
    console.log("plaf 95");
    await expect(page).toMatch("Désormais: Mise à l'abri");
    console.log("plaf 96");
    await expect(page).toMatch("Changement de ressources:");
    console.log("plaf 97");
    await expect(page).toMatch("Avant: Non renseigné");
    console.log("plaf 98");
    await expect(page).toMatch("Désormais: SANS");
    console.log("plaf 99");
    await expect(page).toMatch("Changement de couverture médicale:");
    console.log("plaf 100");
    await expect(page).toMatch("Avant: Non renseigné");
    console.log("plaf 101");
    await expect(page).toMatch("Désormais: Aucune");
  });

  /*
  COMMENT CREATION
  */

  it("should be able to create a comment for this person", async () => {
    console.log("plaf 102");
    await expect(page).toClick("a", { text: "Commentaires (1)" });
    console.log("plaf 103");
    await expect(page).toClick("button", { text: "Ajouter un commentaire" });
    console.log("plaf 104");
    await expect(page).toMatch("Créer un commentaire", { timeout: 4000 });
    console.log("plaf 105");
    await expect(page).toFill('textarea[name="comment"]', "Ceci est un commentaire");
    console.log("plaf 106");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    console.log("plaf 107");
    await expect(page).toClick("div.close-toastr");
    console.log("plaf 108");
    await expect(page).toMatch("Ceci est un commentaire");
  });

  it("should be able to create another comment for this person", async () => {
    await page.waitForTimeout(1000);
    console.log("plaf 109");
    await expect(page).toClick("a", { text: "Commentaires (2)" });
    await page.waitForTimeout(1000);
    console.log("plaf 110");
    await expect(page).toClick("button", { text: "Ajouter un commentaire" });
    console.log("plaf 111");
    await expect(page).toMatch("Créer un commentaire", { timeout: 4000 });
    console.log("plaf 112");
    await expect(page).toFill('textarea[name="comment"]', "Ceci est un autre commentaire");
    console.log("plaf 113");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    await page.waitForTimeout(1000);
    console.log("plaf 114");
    await expect(page).toClick("div.close-toastr");
    console.log("plaf 115");
    await expect(page).toMatch("Ceci est un commentaire");
    console.log("plaf 116");
    await expect(page).toMatch("Ceci est un autre commentaire");
  });

  /*
  PLACE CREATION
  */

  it("should add a place", async () => {
    await navigateWithReactRouter("/place");
    await page.waitForTimeout(1000);
    console.log("plaf 117");
    await expect(page).toClick("button", {
      text: "Créer un nouveau lieu fréquenté",
    });
    await page.waitForTimeout(1000);
    console.log("plaf 118");
    await expect(page).toFill("input#create-place-name", "Mon lieu fréquenté");
    console.log("plaf 119");
    await expect(page).toClick("button#create-place-button");
    await page.waitForTimeout(1000);
    console.log("plaf 120");
    await expect(page).toClick("div.close-toastr");
    await navigateWithReactRouter("/person");
    console.log("plaf 121");
    await expect(page).toClick("td", { text: "Ma première personne" });
    // await scrollTop();
    console.log("plaf 122");
    await expect(page).toClick("a", { text: "Lieux (0)" });
    console.log("plaf 123");
    await expect(page).toClick("button", { text: "Ajouter un lieu" });
    console.log("plaf 124");
    await expect(page).toClick("input#add-place-select-place");
    console.log("plaf 125");
    await expect(page).toClick("div.add-place-select-place__option");
    console.log("plaf 126");
    await expect(page).toMatch("Mon lieu fréquenté");
    console.log("plaf 127");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    console.log("plaf 128");
    await expect(page).toMatch("Lieu ajouté !");
    console.log("plaf 129");
    await expect(page).toClick("div.close-toastr");
    console.log("plaf 130");
    await expect(page).toMatch("Mon lieu fréquenté");
    console.log("plaf 131");
    await expect(page).toMatch("Lieux (1)");
  });

  /*
  RELOAD AND CHECK EVERYTHING IS HERE
  */

  it("should have all the created data showing on reload", async () => {
    await page.goto("http://localhost:8090/auth");
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    console.log("plaf 132");
    await expect(page).toMatch("Encrypted Orga", { timeout: 4000 });
    await navigateWithReactRouter("/person");
    console.log("plaf 133");
    await expect(page).toMatch("Personnes suivies par l'organisation");
    await page.waitForTimeout(1000);
    console.log("plaf 134");
    await expect(page).toMatch("Ma première personne");
    await navigateWithReactRouter("/person");
    console.log("plaf 135");
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
    console.log("plaf 136");
    await expect(page).toClick("a", { text: "Actions (1)" });
    console.log("plaf 137");
    await expect(page).toMatch("Mon action");
    console.log("plaf 138");
    await expect(page).toMatch("A FAIRE");
    console.log("plaf 139");
    await expect(page).toClick("td", { text: "Mon action" });
    console.log("plaf 140");
    await expect(page).toMatch("Mon action");
    console.log("plaf 141");
    await expect(page).toMatch("À FAIRE");
    console.log("plaf 142");
    await expect(page).toMatch("Une petite description pour la route");
    console.log("plaf 143");
    await expect(page).toClick("a", { text: "Retour" });
    console.log("plaf 144");
    await expect(page).toClick("a", { text: "Documents (0)" });
    /* Comments */
    console.log("plaf 145");
    await expect(page).toClick("a", { text: "Commentaires (3)" });
    console.log("plaf 146");
    await expect(page).toMatch("Ceci est un commentaire");
    console.log("plaf 147");
    await expect(page).toMatch("Ceci est un autre commentaire");
    /* Places */
    console.log("plaf 148");
    await expect(page).toClick("a", { text: "Lieux (1)" });
    console.log("plaf 149");
    await expect(page).toMatch("Mon lieu fréquenté");
  });

  it("should be able to put out of active list", async () => {
    console.log("plaf 150");
    await expect(page).toClick("a", { text: "Résumé" });
    console.log("plaf 151");
    await expect(page).toClick("button", { text: "Sortie de file active" });
    console.log("plaf 152");
    await expect(page).toMatch("Veuillez préciser le motif de sortie");
    console.log("plaf 153");
    await expect(page).toClick("input#person-select-outOfActiveListReason");
    console.log("plaf 154");
    await expect(page).toClick("div.person-select-outOfActiveListReason__option");
    console.log("plaf 155");
    await expect(page).toClick("button", { text: "Sauvegarder" });
    console.log("plaf 156");
    await expect(page).toMatch("Mise à jour réussie");
    console.log("plaf 157");
    await expect(page).toClick("div.close-toastr");
    console.log("plaf 158");
    await expect(page).toMatch("Réintégrer dans la file active");
    await scrollTop();
    console.log("plaf 159");
    await expect(page).toMatch(
      "Ma première personne est en dehors de la file active, pour le motif suivant : Relai vers autre structure"
    );
    console.log("plaf 160");
    await expect(page).toClick("a", { text: "Retour" });
    console.log("plaf 161");
    await expect(page).toMatch("Ma première personne");
    console.log("plaf 162");
    await expect(page).toMatch("Sortie de file active : Relai vers autre structure");
  });

  it("should be able to put back in active list", async () => {
    await page.goto("http://localhost:8090/auth");
    await connectWith("adminEncrypted@example.org", "secret", "plouf");
    console.log("plaf 163");
    await expect(page).toMatch("Encrypted Orga", { timeout: 4000 });
    await navigateWithReactRouter("/person");
    console.log("plaf 164");
    await expect(page).toMatch("Personnes suivies par l'organisation");
    await page.waitForTimeout(1000);
    console.log("plaf 165");
    await expect(page).toMatch("Ma première personne");
    console.log("plaf 166");
    await expect(page).toClick("td", { text: "Ma première personne" });
    // await scrollTop();
    console.log("plaf 167");
    await expect(page).toMatch(
      "Ma première personne est en dehors de la file active, pour le motif suivant : Relai vers autre structure"
    );
    console.log("plaf 168");
    await expect(page).toClick("button", {
      text: "Réintégrer dans la file active",
    });
    console.log("plaf 169");
    await expect(page).toMatch("Mise à jour réussie");
    console.log("plaf 170");
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
    console.log("plaf 171");
    await expect(page).toClick("button", { text: "Supprimer" });
  });

  // TODO
  it.skip("should have deleted the person and the action", async () => {
    try {
      console.log("plaf 172");
      await expect(page).toMatch("Ma première personne");
    } catch (e) {
      console.log("NOT MATCH");
      console.log(e);
    }
  });

  it("should be able to see the action in reception", async () => {
    await navigateWithReactRouter("/reception");
    console.log("plaf 173");
    await expect(page).toMatch(
      `Accueil du ${dayjs().format("dddd D MMMM YYYY")} de l'équipe Encrypted Orga Team`
    );
    console.log("plaf 174");
    await expect(page).toMatch("Mon action");
  });

  it("should be able to add a passage", async () => {
    await navigateWithReactRouter("/reception");
    console.log("plaf 175");
    await expect(page).toMatch(
      `Accueil du ${dayjs().format("dddd D MMMM YYYY")} de l'équipe Encrypted Orga Team`
    );
    console.log("plaf 176");
    await expect(page).toClick("input#person-select-and-create-reception");
    console.log("plaf 177");
    await expect(page).toClick("div.person-select-and-create-reception__option");
    expect(await getInnerText("div.person-select-and-create-reception__multi-value__label")).toBe(
      "!Ma première personne - 26/05/1981 (41 ans)"
    );
    console.log("plaf 178");
    await expect(page).toClick("button", { text: "Ajouter un passage" });
    await page.waitForTimeout(1000);
    expect(await getInnerText("span#number-of-passages")).toBe("1");
    await navigateWithReactRouter("/person");
    console.log("plaf 179");
    await expect(page).toClick("td", { text: "Ma première personne" });
    console.log("plaf 180");
    await expect(page).toClick("a", { text: "Passages (1)" });
  });
});
