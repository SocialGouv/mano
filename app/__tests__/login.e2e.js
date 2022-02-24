/* eslint-disable no-undef */

/* Test on onBoarding */
/* Every phone number as his own state */
// jest.retryTimes(3);
jest.setTimeout(300000);
describe('Test onboarding process steps', () => {
  // beforeAll(async () => {
  //   await useEncryptedOrga();
  // });
  beforeEach(async () => {
    await device.uninstallApp();
    await device.installApp();
    await device.launchApp();
  });
  it('should have login screen', async () => {
    console.log('miam');
    await device.reloadReactNative();
    await expect(element(by.id('login-screen'))).toBeVisible();
    await new Promise((res) => setTimeout(res, 1000));
    await element(by.id('login-email')).typeText('adminencrypted@example.org');
    await element(by.id('login-screen')).scroll(150, 'down');
    await element(by.id('login-password')).typeText('secret');
    await element(by.id('login-screen')).scroll(150, 'down');
    await element(by.id('button-connect')).tap();
    await element(by.id('login-screen')).scroll(200, 'down');
    await element(by.id('login-encryption')).typeText('plouf');
    await element(by.id('button-connect')).tap();
    await expect(element(by.id('actions-list'))).toBeVisible();
  });
});
