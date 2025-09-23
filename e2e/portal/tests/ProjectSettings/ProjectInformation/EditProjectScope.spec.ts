import test, { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectSettingsPage from '@121-e2e/portal/pages/ProjectSettingsPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  await getAccessToken();

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Toggle scope in project settings', async ({ page }) => {
  const homePage = new HomePage(page);
  const registrations = new RegistrationsPage(page);
  const projectSettings = new ProjectSettingsPage(page);

  await test.step('Validate that scope is enabled by default', async () => {
    await homePage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.checkColumnAvailability({
      column: 'Scope',
      shouldBeAvailable: true,
    });
  });

  await test.step('Disable scope', async () => {
    await registrations.navigateToProgramPage('Settings');
    await projectSettings.clickEditSectionByTitle('Basic information');

    await page.getByLabel('Use "scope" in this project').click();
    await projectSettings.saveChanges();
    await projectSettings.validateToastMessageAndClose(
      'Basic information details saved successfully.',
    );

    // expect with a timeout because we might need to wait for the cache to invalidate
    await expect(async () => {
      const basicInformationData =
        await projectSettings.basicInformationDataList.getData();
      expect(basicInformationData).toMatchObject({
        'Enable scope': 'No',
      });
    }).toPass({ timeout: 2000 });
  });

  await test.step('Validate that scope is disabled', async () => {
    await projectSettings.navigateToProgramPage('Registrations');
    await registrations.checkColumnAvailability({
      column: 'Scope',
      shouldBeAvailable: false,
    });
  });

  await test.step('Enable scope again', async () => {
    await registrations.navigateToProgramPage('Settings');
    await projectSettings.clickEditSectionByTitle('Basic information');

    await page.getByLabel('Use "scope" in this project').click();
    await projectSettings.saveChanges();
    await projectSettings.validateToastMessageAndClose(
      'Basic information details saved successfully.',
    );

    // expect with a timeout because we might need to wait for the cache to invalidate
    await expect(async () => {
      const basicInformationData =
        await projectSettings.basicInformationDataList.getData();
      expect(basicInformationData).toMatchObject({
        'Enable scope': 'Yes',
      });
    }).toPass({ timeout: 2000 });
  });

  await test.step('Validate that scope is enabled again', async () => {
    await registrations.navigateToProgramPage('Registrations');
    await registrations.checkColumnAvailability({
      column: 'Scope',
      shouldBeAvailable: true,
    });
  });
});
