import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdSafaricom,
  registrationsSafaricom,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const koboIntegrationBase = {
  apiKey: 'mock-token',
};

const alreadyUpToDateUrl = `${env.MOCK_SERVICE_URL}/api/kobo/#/forms/success-asset/summary`;
const alwaysNewVersionUrl = `${env.MOCK_SERVICE_URL}/api/kobo/#/forms/asset-id-happy-flow-always-new-version/summary`;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    registrations: registrationsSafaricom,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/settings/registration-data`,
  });
});

test('Refresh Kobo integration - happy flow (integration updated)', async ({
  registrationDataPage,
}) => {
  await test.step('Add Kobo integration with always-new-version asset', async () => {
    await registrationDataPage.addKoboIntegration({
      url: alwaysNewVersionUrl,
      apiKey: koboIntegrationBase.apiKey,
    });
    await registrationDataPage.koboSuccessfullyLinkedDialog({
      closeDialog: true,
    });
  });

  await test.step('Click "Refresh link" from the ellipsis menu', async () => {
    await registrationDataPage.refreshKoboIntegration();
  });

  await test.step('Validate success toast: integration updated', async () => {
    const updatedAt = new Date(Date.now()).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    await registrationDataPage.validateUpdatedAtValue({ updatedAt });
    await registrationDataPage.validateToastMessageAndClose(
      'Integration updated successfully.',
    );
  });
});

test('Refresh Kobo integration - already up to date', async ({
  registrationDataPage,
}) => {
  await test.step('Add Kobo integration with static-version asset', async () => {
    await registrationDataPage.addKoboIntegration({
      url: alreadyUpToDateUrl,
      apiKey: koboIntegrationBase.apiKey,
    });
    await registrationDataPage.koboSuccessfullyLinkedDialog({
      closeDialog: true,
    });
  });

  await test.step('Click "Refresh link" from the ellipsis menu', async () => {
    await registrationDataPage.refreshKoboIntegration();
  });

  await test.step('Validate info toast: already up to date', async () => {
    await registrationDataPage.validateToastMessageAndClose(
      'Integration is already up to date.',
    );
  });
});

test('Refresh Kobo integration - unsuccessful', async ({
  registrationDataPage,
  page,
}) => {
  await test.step('Add Kobo integration', async () => {
    await registrationDataPage.addKoboIntegration({
      url: alreadyUpToDateUrl,
      apiKey: koboIntegrationBase.apiKey,
    });
    await registrationDataPage.koboSuccessfullyLinkedDialog({
      closeDialog: true,
    });
  });

  await test.step('Intercept PATCH /kobo to simulate a server error', async () => {
    await page.route(`**/api/programs/*/kobo`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({ status: 500 });
        return;
      }
      await route.continue();
    });
  });

  await test.step('Click "Refresh link" from the ellipsis menu', async () => {
    await registrationDataPage.refreshKoboIntegration();
  });

  await test.step('Validate error toast: update unsuccessful', async () => {
    await registrationDataPage.validateToastMessageAndClose(
      'Integration update unsuccessful. Please try again.',
    );
  });
});

test('Refresh Kobo integration - unsuccessful with error payload', async ({
  registrationDataPage,
  page,
}) => {
  await test.step('Add Kobo integration with always-new-version asset', async () => {
    await registrationDataPage.addKoboIntegration({
      url: alwaysNewVersionUrl,
      apiKey: koboIntegrationBase.apiKey,
    });
    await registrationDataPage.koboSuccessfullyLinkedDialog({
      closeDialog: true,
    });
  });

  await test.step('Intercept PATCH /kobo to simulate a validation error response', async () => {
    await page.route(`**/api/programs/*/kobo`, async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify(koboRefreshErrorPayload),
        });
        return;
      }
      await route.continue();
    });
  });

  await test.step('Click "Refresh link" from the ellipsis menu', async () => {
    await registrationDataPage.refreshKoboIntegration();
  });

  await test.step('Validate error dialog for Kobo integration failure', async () => {
    await registrationDataPage.validateToastMessage(
      'Integration update unsuccessful. Please try again.',
    );

    await registrationDataPage.validateErrorDialogIsShown();

    await registrationDataPage.validateMissingFields({
      missingFields: ['phoneNumber'],
    });

    await registrationDataPage.validateKoboConfigurationErrorsTable({
      configurationErrorsTableColumns: ['Field', 'Error', 'Solution'],
      configurationErrors: [
        'fullName',
        "Attribute 'fullName' is missing",
        'Add the missing attribute to the Kobo form',
      ],
    });
  });
});

const koboRefreshErrorPayload = {
  message: 'Kobo form definition validation failed',
  errors: [
    {
      type: 'missingField',
      attributeName: 'phoneNumber',
      error: "Attribute 'phoneNumber' is missing",
      solution: "Add 'phoneNumber' to the Kobo form",
    },
    {
      type: 'missingFullnameAttributes',
      attributeName: 'fullName',
      error: "Attribute 'fullName' is missing",
      solution: 'Add the missing attribute to the Kobo form',
    },
  ],
};
