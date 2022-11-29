import { test, expect, Page } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect, createAction, createPerson, loginWith } from "./utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";

dayjs.extend(utc);
dayjs.locale("fr");
test.beforeAll(async () => {
  await populate();
});

test("Familles", async ({ page }) => {
  // Always use a new items
  const person1Name = nanoid();
  const person2Name = nanoid();
  const person3Name = nanoid();
  const person4Name = nanoid();
  const action1Name = nanoid();
  const comment1Name = nanoid();
  const action3Name = nanoid();

  await loginWith(page, "admin1@example.org");

  await test.step("Enable familles", async () => {
    await page.getByRole("link", { name: "Organisation" }).click();
    await page.getByRole("button", { name: "Personnes suivies" }).click();
    await page
      .getByLabel(
        /Activer\s+la\s+possibilité\s+d'ajouter\s+des\s+liens\s+familiaux\s+entre\s+personnes\.\s+Un\s+onglet\s+"Famille"\s+sera\s+rajouté\s+dans\s+les\s+personnes,\s+et\s+vous\s+pourrez\s+créer\s+des\s+actions,\s+des\s+commentaires\s+et\s+des\s+documents\s+visibles\s+pour\s+toute\s+la\s+famille\./
      )
      .check();

    await page.getByRole("button", { name: "Mettre à jour" }).first().click();
    await page.getByText("Mise à jour !").click();
  });

  await test.step("Create persons", async () => {
    await createPerson(page, person1Name);
    await createPerson(page, person2Name);
    await createPerson(page, person3Name);
    await createPerson(page, person4Name);
  });

  await test.step("Cannot create relation with myself", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();

    await page.getByRole("cell", { name: person1Name }).click();
    await page.getByRole("button", { name: "Liens familiaux (0)" }).click();
    await expect(page.getByText("Cette personne n'a pas encore de lien familial")).toBeVisible();

    await page.getByRole("button", { name: "Ajouter un lien" }).click();
    await clickOnEmptyReactSelect(page, "person-family-relation", person1Name);
    await page.getByPlaceholder("Père/fille, mère/fils...").fill("rel");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Le lien avec cette personne est vite vu : c'est elle !").click();
  });

  await test.step("Create relation ", async () => {
    await expect(page.getByText(`Nouvelle relation entre ${person1Name} et...`)).toBeVisible();
    await changeReactSelectValue(page, "person-family-relation", person2Name);
    await page.getByPlaceholder("Père/fille, mère/fils...").fill("rel");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Le lien familial a été ajouté").click();

    await expect(page.getByRole("cell", { name: `${person1Name} et ${person2Name}` })).toBeVisible();
    await expect(page.getByRole("cell", { name: "rel" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "User Admin Test - 1" })).toBeVisible();
  });

  await test.step("Can update relation", async () => {
    await page
      .locator("tr", { has: page.getByRole("cell", { name: `${person1Name} et ${person2Name}` }) })
      .getByRole("button", { name: "Modifier" })
      .click();

    // cannot update the persons
    await expect(page.getByText(`Nouvelle relation entre ${person1Name} et...`)).not.toBeVisible();
    await page.getByPlaceholder("Père/fille, mère/fils...").fill("je suis ton père");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Le lien familial a été modifié").click();
    await expect(page.getByRole("cell", { name: "je suis ton père" })).toBeVisible();
  });

  await test.step("Can delete relation", async () => {
    page.once("dialog", (dialog) => dialog.accept());
    await page
      .locator("tr", { has: page.getByRole("cell", { name: `${person1Name} et ${person2Name}` }) })
      .getByRole("button", { name: "Supprimer" })
      .click();
    await expect(page.getByRole("cell", { name: `${person1Name} et ${person2Name}` })).not.toBeVisible();
    await expect(page.getByRole("cell", { name: "je suis ton père" })).not.toBeVisible();
    await expect(page.getByRole("cell", { name: "User Admin Test - 1" })).not.toBeVisible();
    await page.getByText("Le lien familial a été supprimé").click();
    await expect(page.getByText("Cette personne n'a pas encore de lien familial")).toBeVisible();
  });

  await test.step("Create again relation", async () => {
    await page.getByRole("button", { name: "Ajouter un lien" }).click();

    await changeReactSelectValue(page, "person-family-relation", person2Name);
    await page.getByPlaceholder("Père/fille, mère/fils...").fill("je suis ton père");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Le lien familial a été ajouté").click();

    await expect(page.getByRole("cell", { name: `${person1Name} et ${person2Name}` })).toBeVisible();
    await expect(page.getByRole("cell", { name: "je suis ton père" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "User Admin Test - 1" })).toBeVisible();
  });

  await test.step("Should have the family icon", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: person1Name }) }).getByText("👪")).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: person2Name }) }).getByText("👪")).toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: person3Name }) }).getByText("👪")).not.toBeVisible();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: person4Name }) }).getByText("👪")).not.toBeVisible();

    await page.getByRole("link", { name: "🔍 Recherche" }).click();
    await expect(page).toHaveURL("http://localhost:8090/search");
    await page.getByPlaceholder("Par mot clé").fill(person1Name);
    await expect(page).toHaveURL(`http://localhost:8090/search?search=${person1Name}`);
    await page.getByText("Personnes (1)").click();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: person1Name }) }).getByText("👪")).toBeVisible();
  });

  await test.step("Relation should be visible also on the other person", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("cell", { name: person2Name }).click();
    await page.getByRole("button", { name: "Liens familiaux (1)" }).click();

    await expect(page.getByRole("cell", { name: `${person1Name} et ${person2Name}` })).toBeVisible();
    await expect(page.getByRole("cell", { name: "je suis ton père" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "User Admin Test - 1" })).toBeVisible();
  });

  await test.step("Cant add a relation between two persons with already a relation between them", async () => {
    await page.getByRole("button", { name: "Ajouter un lien" }).click();
    await clickOnEmptyReactSelect(page, "person-family-relation", person1Name);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Il y a déjà un lien entre ces deux personnes").click();
    await page.getByRole("button", { name: "Annuler" }).click();
  });

  await test.step("A person cant have two groups", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("cell", { name: person3Name }).click();
    await page.getByRole("button", { name: "Liens familiaux (0)" }).click();
    await page.getByRole("button", { name: "Ajouter un lien" }).click();
    await clickOnEmptyReactSelect(page, "person-family-relation", person4Name);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page.getByText("Le lien familial a été ajouté").click();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("cell", { name: person4Name }).click();
    await page.getByRole("button", { name: "Liens familiaux (1)" }).click();
    await page.getByRole("button", { name: "Ajouter un lien" }).click();
    await clickOnEmptyReactSelect(page, "person-family-relation", person2Name);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await page
      .getByText(
        "Cette personne fait déjà partie d'une autre famille. Vous ne pouvez pour l'instant pas ajouter une personne à plusieurs familles. N'hésitez pas à nous contacter si vous souhaitez faire évoluer cette fonctionnalité."
      )
      .click();
    await page.getByRole("button", { name: "Annuler" }).click();
  });

  await test.step("Create action for whole family, should be visible everywhere with the family icon", async () => {
    await page.getByRole("link", { name: "Agenda" }).click();
    await createAction(page, action1Name, person1Name, { group: true });
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: action1Name }) }).getByText("👪")).toBeVisible();

    await page.getByRole("link", { name: "🔍 Recherche" }).click();
    await expect(page).toHaveURL("http://localhost:8090/search");
    await page.getByPlaceholder("Par mot clé").fill(action1Name);
    await expect(page).toHaveURL(`http://localhost:8090/search?search=${action1Name}`);
    await page.getByText("Actions (1)").click();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: action1Name }) }).getByText("👪")).toBeVisible();

    await page.getByRole("link", { name: "Comptes rendus" }).click();
    await page.getByRole("button", { name: dayjs().format("YYYY-MM-DD") }).click();
    await page.getByText("Actions créées (1)").click();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: action1Name }) }).getByText("👪")).toBeVisible();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("cell", { name: person1Name }).click();

    await expect(page.locator("tr", { has: page.getByText(action1Name) }).getByText("👪")).toBeVisible();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("cell", { name: person2Name }).click();

    await expect(page.locator("tr", { has: page.getByText(action1Name) }).getByText("👪")).toBeVisible();
  });

  await test.step("Create comment for whole family, should be visible everywhere with the family icon", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("cell", { name: person1Name }).click();

    await page.locator("button[aria-label='Ajouter un commentaire']").click();
    await page.getByRole("textbox", { name: "Commentaire" }).fill(comment1Name);
    await page.getByLabel("Commentaire familial Ce commentaire sera valable pour chaque membre de la famille").check();
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Commentaire enregistré").click();

    await page.getByRole("link", { name: "🔍 Recherche" }).click();
    await expect(page).toHaveURL("http://localhost:8090/search");

    await page.getByPlaceholder("Par mot clé").fill(comment1Name);
    await expect(page).toHaveURL(`http://localhost:8090/search?search=${comment1Name}`);

    await page.getByText("Commentaires (1)").click();
    await expect(page.locator("tr", { has: page.getByText(comment1Name) }).getByText("👪")).toBeVisible();

    await page.getByRole("link", { name: "Comptes rendus" }).click();
    await page.getByRole("button", { name: dayjs().format("YYYY-MM-DD") }).click();
    await page.getByText("Commentaires (1)").click();
    await expect(page.locator("tr", { has: page.getByRole("cell", { name: comment1Name }) }).getByText("👪")).toBeVisible();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("cell", { name: person1Name }).click();
    await expect(page.locator("tr", { has: page.getByText(comment1Name) }).getByText("👪")).toBeVisible();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("cell", { name: person2Name }).click();
    await expect(page.locator("tr", { has: page.getByText(comment1Name) }).getByText("👪")).toBeVisible();
  });

  await test.step("Create document for whole family, should be visible everywhere with the family icon", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("cell", { name: person1Name }).click();
    await page.locator("label[aria-label='Ajouter un document']").setInputFiles("e2e/files-to-upload/image-1.jpg");
    await page.getByText("Document ajouté !").click();
    await page.getByText("image-1.jpg").click();

    await page.getByLabel("Document familialCe document sera visible pour toute la famille").check();
    await page.getByText("Document mis à jour !").click();
    await page.getByRole("button", { name: "Annuler" }).click();
    await expect(page.locator("tr", { has: page.getByText("image-1.jpg") }).getByText("👪")).toBeVisible();

    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await page.getByRole("cell", { name: person2Name }).click();
    await expect(page.locator("tr", { has: page.getByText("image-1.jpg") }).getByText("👪")).toBeVisible();
  });
});
