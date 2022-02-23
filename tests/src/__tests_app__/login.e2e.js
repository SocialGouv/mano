/* eslint-disable no-undef */

/* Test on onBoarding */
/* Every phone number as his own state */
jest.retryTimes(3);
jest.setTimeout(300000);
describe("Test onboarding process steps", () => {
  beforeAll(async () => {
    await useEncryptedOrga();
  });
  beforeEach(async () => {
    await device.uninstallApp();
    await device.installApp();
    await device.launchApp();
  });
});
