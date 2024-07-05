import { test, expect } from "@playwright/test";
import { populate } from "./scripts/populate-db";
import { loginWith } from "./utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import "dayjs/locale/fr";

dayjs.extend(utc);
dayjs.locale("fr");
test.beforeAll(async () => {
  await populate();
});

test("Replace me", async ({ page }) => {
  await loginWith(page, "admin1@example.org");
  // Copier ce code dans un nouveau fichier, lancer le test une première fois, puis faire "record at cursor".
});
