import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import { populate } from "./scripts/populate-db";
import { changeReactSelectValue, clickOnEmptyReactSelect } from "./utils";

test.beforeAll(async () => {
  await populate();
});

test("Actions", async ({ page }) => {
  // Always use a new items
  const group1Name = nanoid();
  const groupe1cat1 = nanoid();
  const groupe1cat2 = nanoid();
  const group2Name = nanoid();
  const groupe2cat1 = nanoid();
  const groupe2cat2 = nanoid();
  const groupe2cat2Renamed = nanoid();
  const groupe3Name = nanoid();
  const groupe3cat1ToBeDeleted = nanoid();
  const groupe3cat2 = nanoid();
  const personName = nanoid();
  const action1Name = nanoid();
  const action2Name = nanoid();
  const action3Name = nanoid();

  const createGroup = async (groupName: string) => {
    await page.getByRole("button", { name: "Ajouter un groupe" }).click();

    await page.getByLabel("Titre du groupe").fill(groupName);

    await page.getByRole("dialog", { name: "Ajouter un groupe de catégories" }).getByRole("button", { name: "Ajouter" }).click();

    await page.getByText("Groupe ajouté").click();
  };

  const createAction = async (actionName: string, categories: Array<{ group: string; category: string }>) => {
    await page.getByRole("link", { name: "Agenda" }).click();

    await page.getByRole("button", { name: "Créer une nouvelle action" }).click();

    await page.getByLabel("Nom de l'action").fill(actionName);

    await clickOnEmptyReactSelect(page, "create-action-person-select", personName);

    await page.locator("#categories").getByText("-- Choisir --").click();

    for (const { group, category } of categories) {
      await page.getByRole("button", { name: `${group} (2)` }).click();
      await page.getByRole("button", { name: category }).click();
    }

    await page.getByRole("button", { name: "Fermer" }).click();

    await page.getByRole("button", { name: "Sauvegarder" }).click();

    await page.getByText("Création réussie !").click();
  };

  await test.step("Log in", async () => {
    await page.goto("http://localhost:8090/");

    await page.goto("http://localhost:8090/auth");

    await page.getByLabel("Email").click();

    await page.getByLabel("Email").fill("admin6@example.org");

    await page.getByLabel("Mot de passe").click();

    await page.getByLabel("Mot de passe").fill("secret");

    await page.getByRole("button", { name: "Se connecter" }).click();

    await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");

    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");
  });

  await test.step("Create first group to be renamed", async () => {
    await page.getByRole("link", { name: "Organisation" }).click();

    await page.getByRole("button", { name: "Actions" }).click();

    await createGroup(group1Name);
  });

  await test.step("Create first category in first group", async () => {
    await page.locator(`details[data-group='${group1Name}']`).getByPlaceholder("Ajouter une catégorie").fill(groupe1cat1);

    await page.locator(`details[data-group='${group1Name}']`).getByRole("button", { name: "Ajouter" }).click();

    await page.getByText("Catégorie ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();
  });

  await test.step("Create same category should throw an error", async () => {
    await page.locator(`details[data-group='${group1Name}']`).getByPlaceholder("Ajouter une catégorie").fill(groupe1cat1);

    await page.locator(`details[data-group='${group1Name}']`).getByRole("button", { name: "Ajouter" }).click();

    await page.getByText(`Cette catégorie existe déjà: ${group1Name} > ${groupe1cat1}`).click();
  });

  await test.step("Create second category in first group", async () => {
    await page.locator(`details[data-group='${group1Name}']`).getByPlaceholder("Ajouter une catégorie").fill(groupe1cat2);

    await page.locator(`details[data-group='${group1Name}']`).getByRole("button", { name: "Ajouter" }).click();

    await page.getByText("Catégorie ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();
  });

  await test.step("Create same group should throw an error", async () => {
    await page.getByRole("button", { name: "Ajouter un groupe" }).click();

    await page.getByLabel("Titre du groupe").fill(group1Name);

    await page.getByRole("dialog", { name: "Ajouter un groupe de catégories" }).getByRole("button", { name: "Ajouter" }).click();

    await page.getByText("Ce groupe existe déjà").click();
  });

  await test.step("Create second group", async () => {
    await createGroup(group2Name);
  });

  await test.step("Create first category in second group", async () => {
    await page.locator(`details[data-group='${group2Name}']`).getByPlaceholder("Ajouter une catégorie").fill(groupe2cat1);

    await page.locator(`details[data-group='${group2Name}']`).getByRole("button", { name: "Ajouter" }).click();

    await page.getByText("Catégorie ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();
  });

  await test.step("Create second category in second group, to be renamed", async () => {
    await page.locator(`details[data-group='${group2Name}']`).getByPlaceholder("Ajouter une catégorie").fill(groupe2cat2);

    await page.locator(`details[data-group='${group2Name}']`).getByRole("button", { name: "Ajouter" }).click();

    await page.getByText("Catégorie ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();
  });

  await test.step("Create third group and category to be deleted", async () => {
    await createGroup(groupe3Name);

    await page.locator(`details[data-group='${groupe3Name}']`).getByPlaceholder("Ajouter une catégorie").fill(groupe3cat1ToBeDeleted);

    await page.locator(`details[data-group='${groupe3Name}']`).getByRole("button", { name: "Ajouter" }).click();

    await page.getByText("Catégorie ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();

    await page.locator(`details[data-group='${groupe3Name}']`).getByPlaceholder("Ajouter une catégorie").fill(groupe3cat2);

    await page.locator(`details[data-group='${groupe3Name}']`).getByRole("button", { name: "Ajouter" }).click();

    await page.getByText("Catégorie ajoutée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();
  });

  await test.step("Drag and drop category works", async () => {
    await expect(page.getByText(`${group2Name} (2)`)).toBeVisible();
    await expect(page.getByText(`${group1Name} (2)`)).toBeVisible();
    await page.locator(`id=${groupe1cat1}`).dragTo(page.locator(`id=${group2Name}`));
    await expect(page.getByText(`${group2Name} (3)`)).toBeVisible();
    await expect(page.getByText(`${group1Name} (1)`)).toBeVisible();
    await page.locator(`id=${groupe1cat1}`).dragTo(page.locator(`id=${group1Name}`));
    await expect(page.getByText(`${group2Name} (2)`)).toBeVisible();
    await expect(page.getByText(`${group1Name} (2)`)).toBeVisible();
  });

  await test.step("Drag and drop group works", async () => {
    await expect(page.locator(".category-group-title").nth(1)).not.toHaveText(group1Name);
    await page.locator(`id=${group1Name}`).dragTo(page.locator(`id=category-groups`), {
      sourcePosition: { x: 5, y: 5 },
      targetPosition: { x: 10, y: 20 },
    });
    await expect(page.locator(".category-group-title").first()).toHaveText(`${group1Name} (2)`);
  });

  await test.step("Create one person to assign actions", async () => {
    await page.getByRole("link", { name: "Personnes suivies" }).click();
    await expect(page).toHaveURL("http://localhost:8090/person");
    await page.getByRole("button", { name: "Créer une nouvelle personne" }).click();
    await page.getByLabel("Nom").click();
    await page.getByLabel("Nom").fill(personName);
    await page.getByRole("button", { name: "Sauvegarder" }).click();
    await page.getByText("Création réussie !").click();
  });

  await test.step("Create actions", async () => {
    await createAction(action1Name, [
      { group: group1Name, category: groupe1cat1 },
      { group: group2Name, category: groupe2cat1 },
    ]);

    await createAction(action2Name, [
      { group: group1Name, category: groupe1cat2 },
      { group: group2Name, category: groupe2cat2 },
    ]);

    await createAction(action3Name, [{ group: groupe3Name, category: groupe3cat1ToBeDeleted }]);
  });

  await test.step("Search for category", async () => {
    await page.getByRole("link", { name: "Agenda" }).click();
    await page.getByText(action3Name).click();

    await page.locator("#categories").getByRole("button").last().click();

    await page.getByPlaceholder("Recherchez...").fill(groupe2cat2);

    await page.getByRole("button", { name: `${group2Name} (1)` }).click();

    await page.getByRole("button", { name: groupe2cat2 }).click();

    await page.getByRole("button", { name: "Fermer" }).click();

    await page.getByRole("button", { name: "Mettre à jour" }).click();

    await page.getByText("Mise à jour !").click();
  });

  await test.step("Check for proper categories on actions", async () => {
    await page.getByRole("link", { name: "Agenda" }).click();

    await expect(page.locator(`data-test-id=${action1Name}${groupe1cat1}`)).toBeVisible();

    await expect(page.locator(`data-test-id=${action1Name}${groupe2cat1}`)).toBeVisible();

    await expect(page.locator(`data-test-id=${action2Name}${groupe1cat2}`)).toBeVisible();

    await expect(page.locator(`data-test-id=${action2Name}${groupe2cat2}`)).toBeVisible();

    await expect(page.locator(`data-test-id=${action3Name}${groupe3cat1ToBeDeleted}`)).toBeVisible();

    await expect(page.locator(`data-test-id=${action3Name}${groupe2cat2}`)).toBeVisible();
  });

  await test.step("Update category name", async () => {
    await page.getByRole("link", { name: "Organisation" }).click();

    await page.getByRole("button", { name: "Actions" }).click();

    await page.hover(`id=${groupe2cat2}`);
    await page.getByRole("button", { name: `Modifier la catégorie ${groupe2cat2}` }).click();

    await page.getByPlaceholder(groupe2cat2).fill(groupe2cat2Renamed);

    await page
      .getByRole("dialog", { name: `Éditer la catégorie: ${groupe2cat2}` })
      .getByRole("button", { name: "Enregistrer" })
      .click();

    await page.getByText("Catégorie mise à jour. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();
  });

  await test.step("Delete category", async () => {
    await page.hover(`id=${groupe3cat1ToBeDeleted}`);
    await page
      .getByRole("button", {
        name: `Modifier la catégorie ${groupe3cat1ToBeDeleted}`,
      })
      .click();

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page
      .getByRole("dialog", {
        name: `Éditer la catégorie: ${groupe3cat1ToBeDeleted}`,
      })
      .getByRole("button", { name: "Supprimer" })
      .click();

    await page.getByText("Catégorie supprimée. Veuillez notifier vos équipes pour qu'elles rechargent leur app ou leur dashboard").click();
  });

  await test.step("Check for proper categories on actions", async () => {
    await page.getByRole("link", { name: "Agenda" }).click();

    await expect(page.locator(`data-test-id=${action1Name}${groupe1cat1}`)).toBeVisible();

    await expect(page.locator(`data-test-id=${action1Name}${groupe2cat1}`)).toBeVisible();

    await expect(page.locator(`data-test-id=${action2Name}${groupe1cat2}`)).toBeVisible();

    await expect(page.locator(`data-test-id=${action2Name}${groupe2cat2Renamed}`)).toBeVisible();

    await expect(page.locator(`data-test-id=${action3Name}${groupe3cat1ToBeDeleted}`)).not.toBeVisible();

    await expect(page.locator(`data-test-id=${action3Name}${groupe2cat2Renamed}`)).toBeVisible();
  });
});
