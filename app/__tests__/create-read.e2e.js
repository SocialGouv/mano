/* eslint-disable max-len */
/* eslint-disable no-undef */
// const { useEncryptedOrga } = require('mano-tests');

// jest.retryTimes(3);
jest.setTimeout(300000);

const login = async () => {
  await expect(element(by.id('login-screen'))).toBeVisible();
  await new Promise((res) => setTimeout(res, 1000));
  try {
    await expect(element(by.text('adminencrypted@example.org'))).toBeVisible();
  } catch (e) {
    await element(by.id('login-email')).typeText('adminencrypted@example.org');
  }
  await element(by.id('login-screen')).scroll(150, 'down');
  await element(by.id('login-password')).typeText('secret');
  await element(by.id('login-screen')).scroll(150, 'down');
  await element(by.id('button-connect')).tap();
  await element(by.id('login-screen')).scroll(200, 'down');
  await element(by.id('login-encryption')).typeText('plouf');
  await element(by.id('button-connect')).tap();
  await expect(element(by.id('actions-list'))).toBeVisible();
};

describe('Test onboarding process steps', () => {
  beforeAll(async () => {
    // await useEncryptedOrga();
  });
  beforeAll(async () => {
    await device.uninstallApp();
    await device.installApp();
    await device.launchApp();
    // await device.reloadReactNative();
  });
  it('should login', login);

  it('should create a person, an action and a territory', async () => {
    await element(by.id('tab-bar-persons')).tap();
    await element(by.id('add-person-button')).tap();
    await expect(element(by.id('new-person-form'))).toBeVisible();
    // accents not supported in Detox
    await element(by.id('new-person-pseudo')).typeText('Ma deuxieme personne');
    await element(by.id('new-person-create')).tap();
    await expect(element(by.id('person'))).toBeVisible();
    await element(by.id('person-summary')).scrollTo('bottom');
    await element(by.id('person-actions-list-add')).tap();
    await expect(element(by.id('new-action-form'))).toBeVisible();
    await element(by.id('new-action-name')).typeText('Mon autre action');
    await element(by.id('login-screen')).scroll(300, 'down');
    await element(by.id('new-action-dueAt')).tap();
    await element(by.text('OK')).tap();
    await element(by.id('new-action-form')).scrollTo('bottom');
    await element(by.id('new-action-create')).tap();
    await expect(element(by.text('Mon autre action - Ma deuxieme personne'))).toBeVisible();
    await element(by.id('action-back-button')).tap();
    await element(by.id('person-back-button')).tap();
    await element(by.id('tab-bar-territories')).tap();
    await element(by.id('add-territory-button')).tap();
    await expect(element(by.id('new-territory-form'))).toBeVisible();
    await element(by.id('new-territory-name')).typeText('Mon deuxieme territoire');
    await element(by.id('new-territory-create')).tap();
    await expect(element(by.id('territory'))).toBeVisible();
    await element(by.id('territory')).scrollTo('bottom');
    await element(by.id('observations-add')).tap();
    await expect(element(by.id('observation'))).toBeVisible();
  });

  it('should see everything on app reload', async () => {
    await device.reloadReactNative();
    await login();
    await expect(element(by.text('Mon autre action'))).toBeVisible();
    await expect(element(by.text('Pour Ma deuxieme personne'))).toBeVisible();
    await element(by.id('action-row-person-ma-deuxieme-personne-button')).tap();
    await expect(element(by.id('person'))).toBeVisible();
    await element(by.id('person-summary')).scrollTo('bottom');
    await element(by.id('person-actions-list-expand')).tap();
    await element(by.id('person-summary')).scrollTo('bottom');
    /*
    .atIndex(0) is to avoid the following error
    DetoxRuntimeError: Test Failed: '(view.getTag() is "action-row-mon-autre-action-button" and view has effective visibility <VISIBLE>)' matches multiple views in the hierarchy.
    */
    await element(by.id('person-action-row-mon-autre-action-button')).tap();
    await expect(element(by.text('Mon autre action - Ma deuxieme personne'))).toBeVisible();
    await element(by.id('action-back-button')).tap();
    await element(by.id('person-back-button')).tap();
    await element(by.id('tab-bar-territories')).tap();
    await expect(element(by.text('Mon deuxieme territoire'))).toBeVisible();
    await element(by.id('territory-row-mon-deuxieme-territoire-button')).tap();
  });
});
