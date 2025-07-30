import { type Page, test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
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
const pauseStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Paused" successfully\. The status change can take up to a minute to process\./;

// Arrange
test.describe('Change status of registration with status "Included"', () => {
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
  test('[31211] Move PA(s) from status "Included" to "Completed"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPvMaxPayment],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await setupTestEnvironment();

    // Act
    await test.step('Validate the status of the registration', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText:
          registrationsPvStatusChange.registrationPvMaxPayment.fullName,
      });
      await registrations.validateStatusOfFirstRegistration({
        status: 'Included',
      });
    });

    await test.step('Change status of registratios to "Completed" with doing a payment', async () => {
      await doPayment({
        programId: programIdPV,
        paymentNr: 1,
        amount: 100,
        referenceIds: [
          registrationsPvStatusChange.registrationPvMaxPayment.referenceId,
        ],
        accessToken,
      });
      // Wait for payment transactions to complete
      await waitForPaymentTransactionsToComplete({
        programId: programIdPV,
        paymentReferenceIds: [
          registrationsPvStatusChange.registrationPvMaxPayment.referenceId,
        ],
        accessToken,
        maxWaitTimeMs: 5_000,
        completeStatusses: Object.values(TransactionStatusEnum),
      });
      // Wait for the page to reload to reflect the status change from the api call
      await page.reload();
    });

    await test.step('Search for the registration with status "Completed"', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText:
          registrationsPvStatusChange.registrationPvMaxPayment.fullName,
      });
    });
    // Assert
    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Completed',
      });
      await tableComponent.clearAllFilters();
    });
  });

  test('[31213] Move PA(s) from status "Included" to "Declined"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV6],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await setupTestEnvironment();

    // Act
    await test.step('Change status of first selected registration to "Declined"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationsPvStatusChange.registrationPV6.fullName,
        status: 'Decline',
        sendMessage: false,
      });
      await registrations.validateToastMessageAndClose(
        declineStatusToastMessage,
      );
    });

    await test.step('Search for the registration with status "Declined"', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV6.fullName,
      });
    });
    // Assert
    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Declined',
      });
      await tableComponent.clearAllFilters();
    });
  });

  test('[31212] Move PA(s) from status "Included" to "Paused"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV7],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await setupTestEnvironment();
    // Act
    await test.step('Change status of first selected registration to "Paused"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationsPvStatusChange.registrationPV7.fullName,
        status: 'Pause',
        sendMessage: false,
      });
      await registrations.validateToastMessageAndClose(pauseStatusToastMessage);
    });

    await test.step('Search for the registration with status "Paused"', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV7.fullName,
      });
    });
    // Assert
    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Paused',
      });
      await tableComponent.clearAllFilters();
    });
  });
});
