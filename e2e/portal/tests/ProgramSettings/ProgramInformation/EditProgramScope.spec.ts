import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { patchProgram } from '@121-service/test/helpers/program.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
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
  // Arrange
  const accessToken = await getAccessToken();

  await test.step('Validate that scope is enabled by default', async () => {
    // Assert
    await registrationsPage.checkColumnAvailability({
      column: 'Scope',
      shouldBeAvailable: true,
    });
  });

  await test.step('Disable scope', async () => {
    // Act
    await patchProgram(programIdPV, { enableScope: false }, accessToken);
    await programSettingsPage.navigateToProgramPage('Settings');
    await page.reload();

    // Assert
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
    // Act
    await programSettingsPage.navigateToProgramPage('Registrations');
    await page.reload();

    // Assert
    await registrationsPage.checkColumnAvailability({
      column: 'Scope',
      shouldBeAvailable: false,
    });
  });

  await test.step('Enable scope again', async () => {
    // Act
    await patchProgram(programIdPV, { enableScope: true }, accessToken);
    await programSettingsPage.navigateToProgramPage('Settings');
    await page.reload();

    // Assert
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
    // Act
    await programSettingsPage.navigateToProgramPage('Registrations');
    await page.reload();

    // Assert
    await registrationsPage.checkColumnAvailability({
      column: 'Scope',
      shouldBeAvailable: true,
    });
  });
});
