import { test, expect } from "@playwright/test";
import { nanoid } from "nanoid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";
import { changeReactSelectValue, clickOnEmptyReactSelect } from "./utils";

dayjs.extend(utc);
dayjs.locale("fr");

test("Cross teams report", async ({ page }) => {
  test.setTimeout(120000);

  // Always use a new items
  const today = dayjs();
  // const team1Name = nanoid();
  // const team2Name = nanoid();
  // const person1Name = nanoid();
  // const person2Name = nanoid();
  // const person1action = nanoid();
  // const person2action = nanoid();
  // const team1Description = nanoid();
  // const team2Description = nanoid();
  // const team1Collab = nanoid();
  // const team2Collab = nanoid();
  const team1Name = "team1Name";
  const team2Name = "team2Name";
  const person1Name = "person1Name";
  const person2Name = "person2Name";
  const person1action = "person1action";
  const person2action = "person2action";
  const team1Description = "team1Description";
  const team2Description = "team2Description";
  const team1Collab = "team1Collab";
  const team2Collab = "team2Collab";

  /*
  Login

  */
  await page.goto("http://localhost:8090/");

  await page.goto("http://localhost:8090/auth");

  await page.getByLabel("Email").click();

  await page.getByLabel("Email").fill("admin1@example.org");

  await page.getByLabel("Mot de passe").click();

  await page.getByLabel("Mot de passe").fill("secret");

  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.getByLabel("Clé de chiffrement d'organisation").fill("plouf");

  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL("http://localhost:8090/reception?calendarTab=2");
});
