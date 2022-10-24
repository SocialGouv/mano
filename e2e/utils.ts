import pg from "pg";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { ElementHandle, Page } from "@playwright/test";

export default async function reactSelect(
  page: Page,
  instanceId: string,
  optionText: string
) {
  const innerDetailWithKnownId = await page.waitForSelector(
    `#react-select-${instanceId}-live-region`
  );

  const select = await parentElement(innerDetailWithKnownId);
  await select!.click();
  const option = await page.waitForSelector(
    `#react-select-${instanceId}-listbox div:text('${optionText}')`
  );
  await option.scrollIntoViewIfNeeded();
  await option.click();
}

function parentElement(element: ElementHandle<any>) {
  return element.$("xpath=..");
}

// <div class="person-select-personalSituation__menu css-1hueuxh-menu"><div class="person-select-personalSituation__menu-list css-1kpp62a-MenuList"><div class="person-select-personalSituation__option css-9mqv0d-option" id="react-select-9-option-0" tabindex="-1">Aucune</div><div class="person-select-personalSituation__option person-select-personalSituation__option--is-selected css-kd1e6q-option" id="react-select-9-option-1" tabindex="-1">Homme isolé</div><div class="person-select-personalSituation__option css-9mqv0d-option" id="react-select-9-option-2" tabindex="-1">Femme isolée</div><div class="person-select-personalSituation__option css-9mqv0d-option" id="react-select-9-option-3" tabindex="-1">En couple</div><div class="person-select-personalSituation__option css-9mqv0d-option" id="react-select-9-option-4" tabindex="-1">Famille</div><div class="person-select-personalSituation__option css-9mqv0d-option" id="react-select-9-option-5" tabindex="-1">Famille monoparentale</div><div class="person-select-personalSituation__option person-select-personalSituation__option--is-focused css-ycxnge-option" id="react-select-9-option-6" tabindex="-1">Autre</div></div></div>
