import test from '@playwright/test';
import { type Page } from '@playwright/test';

import { env } from '@121-service/src/env';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationsPvStatusChange,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const includedStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Included" successfully\. The status change can take up to a minute to process\./;

// Arrange
test.describe('Change status of registration with different status transitions', () => {
  let page: Page;
  let accessToken: string;

  test.beforeAll(async ({ browser }) => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    page = await browser.newPage();
    const loginPage = new LoginPage(page);
    await page.goto(`/`);
    await loginPage.login(
      env.USERCONFIG_121_SERVICE_EMAIL_ADMIN ?? '',
      env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN ?? '',
    );
  });

  test.afterEach(async () => {
    await page.goto('/');
  });

  test.afterAll(async () => {
    await page.close();
  });

  // Helper function for common arrangement steps
  async function setupTestEnvironment(): Promise<void> {
    const registrations = new RegistrationsPage(page);
    const loginPage = new LoginPage(page);

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();
  }

  // Act and Assert
  test('[31220] Move PA(s) from status "Declined" to "Included"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV5],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.declined,
    );

    await setupTestEnvironment();

    // Act
    await test.step('Search for the registration with status "Declined"', async () => {
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Declined',
      });
    });

    await test.step('Change status of first selected registration to "Included"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPV5.fullName,
        status: 'Include',
        sendMessage: false,
      });
      await registrations.validateToastMessageAndClose(
        includedStatusToastMessage,
      );
    });

    await test.step('Search for the registration with status "Included"', async () => {
      await tableComponent.clearAllFilters();
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Included',
      });
    });

    // Assert
    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Included',
      });
    });
  });
});
