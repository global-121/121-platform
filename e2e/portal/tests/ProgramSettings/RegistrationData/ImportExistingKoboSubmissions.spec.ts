import { expect } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const koboIntegrationDetails = {
  url: `${env.MOCK_SERVICE_URL}/api/kobo/#/forms/success-asset/summary`,
  apiKey: 'mock-token',
};

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/registrations`,
  });
});

test('Import existing Kobo submissions successfully', async ({
  page,
  registrationDataPage,
}) => {
  await test.step('Add Kobo integration', async () => {
    await registrationDataPage.navigateToProgramPage('Settings');
    await registrationDataPage.clickRegistrationDataSection();
    await registrationDataPage.addKoboToolboxIntegration({
      url: koboIntegrationDetails.url,
      apiKey: koboIntegrationDetails.apiKey,
    });
    await registrationDataPage.validateKoboIntegration({
      koboFormName: '25042025 Prototype Sprint',
    });
    await registrationDataPage.clickContinueButton();
    await registrationDataPage.validateToastMessageAndClose(
      'Kobo form successfully integrated.',
    );
  });

  await test.step('Trigger import of existing Kobo submissions', async () => {
    await page.getByTestId('ellipsis-menu-button').click();
    await page.getByRole('menuitem', { name: 'Import existing reg.' }).click();
  });

  await test.step('Validate import result dialog', async () => {
    await expect(
      page.getByText(
        '1 existing Kobo submission(s) have been imported as registrations.',
      ),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
  });
});
