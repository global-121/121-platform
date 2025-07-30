import { type Page, test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  seedRegistrationsWithStatus,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPvStatusChange,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const declineStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Declined" successfully\. The status change can take up to a minute to process\./;
const includeStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Included" successfully\. The status change can take up to a minute to process\./;

// Arrange
test.describe('Change status of registration from status "Completed"', () => {
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
  test('[31215] Move PA(s) from status "Completed" to "Declined"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV5],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await setupTestEnvironment();

    await test.step('Validate the status of the registration', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV5.fullName,
      });
      await registrations.validateStatusOfFirstRegistration({
        status: 'Included',
      });
    });

    await test.step('Change status of registration to "Completed" with doing a payment', async () => {
      await doPayment({
        programId: 2,
        paymentNr: 1,
        amount: 25,
        referenceIds: [registrationsPvStatusChange.registrationPV5.referenceId],
        accessToken,
      });
      // Wait for the page to reload to reflect the status change from the api call
      await page.reload();
    });

    await test.step('Change status of registration to "Declined"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        selectByStatus: true,
        registrationStatus: RegistrationStatusEnum.completed,
        status: 'Decline',
        sendMessage: false,
        selectAllRows: true,
      });
      await registrations.validateToastMessageAndClose(
        declineStatusToastMessage,
      );
    });
    // Assert
    await test.step('Validate status change', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV5.fullName,
      });
      await registrations.validateStatusOfFirstRegistration({
        status: 'Declined',
      });
      await tableComponent.clearAllFilters();
    });
  });

  test('[31214] Move PA(s) from status "Completed" to "Included"', async () => {
    const accessToken = await getAccessToken();
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV6],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );
    // Make payment to change status to "Completed"
    await doPayment({
      programId: 2,
      paymentNr: 1,
      amount: 25,
      referenceIds: [registrationsPvStatusChange.registrationPV6.referenceId],
      accessToken,
    });

    await setupTestEnvironment();

    await test.step('Validate the status of the registration', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV6.fullName,
      });
      await registrations.validateStatusOfFirstRegistration({
        status: 'Completed',
      });
      await tableComponent.clearAllFilters();
    });

    await test.step('Raise amount of max payments for the registration', async () => {
      await updateRegistration(
        2,
        registrationsPvStatusChange.registrationPV6.referenceId,
        {
          maxPayments: '2',
        },
        'automated test',
        accessToken,
      );
      // Wait for the page to reload to reflect the status change from the api call
      await page.reload();
    });

    await test.step('Change status of registration to "Included"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        selectByStatus: true,
        registrationStatus: RegistrationStatusEnum.completed,
        status: 'Include',
        sendMessage: false,
      });
      await registrations.validateToastMessageAndClose(
        includeStatusToastMessage,
      );
    });
    // Assert
    await test.step('Validate status change', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV6.fullName,
      });
      await registrations.validateStatusOfFirstRegistration({
        status: 'Included',
      });
      await tableComponent.clearAllFilters();
    });
  });
});
