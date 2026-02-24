import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('Toggle scope in program settings', async ({
  page,
  registrationsPage,
  programSettingsPage,
}) => {
  await test.step('Validate that scope is enabled by default', async () => {
    await registrationsPage.checkColumnAvailability({
      column: 'Scope',
      shouldBeAvailable: true,
    });
  });

  await test.step('Disable scope', async () => {
    await programSettingsPage.navigateToProgramPage('Settings');
    await programSettingsPage.clickEditProgramInformationSectionByTitle(
      'Basic information',
    );

    await page.getByLabel('Use "scope" in this program').click();
    await programSettingsPage.saveChanges();
    await programSettingsPage.validateToastMessageAndClose(
      'Basic information details saved successfully.',
    );

    // expect with a timeout because we might need to wait for the cache to invalidate
    await expect(async () => {
      const basicInformationData =
        await programSettingsPage.basicInformationDataList.getData();
      expect(basicInformationData).toMatchObject({
        'Enable scope': 'No',
      });
    }).toPass({ timeout: 2000 });
  });

  await test.step('Validate that scope is disabled', async () => {
    await programSettingsPage.navigateToProgramPage('Registrations');
    await registrationsPage.checkColumnAvailability({
      column: 'Scope',
      shouldBeAvailable: false,
    });
  });

  await test.step('Enable scope again', async () => {
    await programSettingsPage.navigateToProgramPage('Settings');
    await programSettingsPage.clickEditProgramInformationSectionByTitle(
      'Basic information',
    );

    await page.getByLabel('Use "scope" in this program').click();
    await programSettingsPage.saveChanges();
    await programSettingsPage.validateToastMessageAndClose(
      'Basic information details saved successfully.',
    );

    // expect with a timeout because we might need to wait for the cache to invalidate
    await expect(async () => {
      const basicInformationData =
        await programSettingsPage.basicInformationDataList.getData();
      expect(basicInformationData).toMatchObject({
        'Enable scope': 'Yes',
      });
    }).toPass({ timeout: 2000 });
  });

  await test.step('Validate that scope is enabled again', async () => {
    await programSettingsPage.navigateToProgramPage('Registrations');
    await registrationsPage.checkColumnAvailability({
      column: 'Scope',
      shouldBeAvailable: true,
    });
  });
});
