import { type Page, test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  changeRegistrationStatus,
  seedRegistrationsWithStatus,
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

const deleteStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Deleted" successfully\. The status change can take up to a minute to process\./;

// Arrange
test.describe('Delete registration with different allowed statuses', () => {
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

  test('[34411] Delete registration with status "Completed"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPvMaxPayment],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );
    // Make payment to change status to "Completed"
    await doPayment({
      programId: 2,
      paymentNr: 1,
      amount: 25,
      referenceIds: [
        registrationsPvStatusChange.registrationPvMaxPayment.referenceId,
      ],
      accessToken,
    });

    await setupTestEnvironment();

    await test.step('Delete registration with status "Completed"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName:
          registrationsPvStatusChange.registrationPvMaxPayment.fullName,
        status: 'Delete',
        sendMessage: false,
      });
      await registrations.validateToastMessageAndClose(
        deleteStatusToastMessage,
      );
    });
    // Assert
    await test.step('Validate registration was deleted succesfully', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText:
          registrationsPvStatusChange.registrationPvMaxPayment.fullName,
      });
      await tableComponent.assertEmptyTableState();
      await tableComponent.clearAllFilters();
    });
  });

  test('[34412] Delete registration with status "Declined"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV5],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.declined,
    );

    await setupTestEnvironment();

    await test.step('Delete registration with status "Declined"', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV5.fullName,
      });
      await tableComponent.updateRegistrationStatusWithOptions({
        selectByStatus: true,
        registrationStatus: RegistrationStatusEnum.declined,
        status: 'Delete',
        sendMessage: false,
        selectAllRows: true,
      });
      await registrations.validateToastMessageAndClose(
        deleteStatusToastMessage,
      );
    });
    // Assert
    await test.step('Validate registration was deleted succesfully', async () => {
      await tableComponent.assertEmptyTableState();
      await tableComponent.clearAllFilters();
    });
  });

  test('[34409] Delete registration with status "Included"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV6],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await setupTestEnvironment();

    await test.step('Delete registration with status "Included"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        selectByStatus: true,
        registrationStatus: RegistrationStatusEnum.included,
        status: 'Delete',
        sendMessage: false,
        selectAllRows: true,
      });
      await registrations.validateToastMessageAndClose(
        deleteStatusToastMessage,
      );
    });
    // Assert
    await test.step('Validate registration was deleted succesfully', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV6.fullName,
      });
      await tableComponent.assertEmptyTableState();
      await tableComponent.clearAllFilters();
    });
  });

  test('[34408] Delete registration with status "New"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV7],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await setupTestEnvironment();

    await test.step('Delete registration with status "New"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        selectByStatus: true,
        registrationStatus: RegistrationStatusEnum.new,
        status: 'Delete',
        sendMessage: false,
        selectAllRows: true,
      });
      await registrations.validateToastMessageAndClose(
        deleteStatusToastMessage,
      );
    });
    // Assert
    await test.step('Validate registration was deleted succesfully', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV7.fullName,
      });
      await tableComponent.assertEmptyTableState();
      await tableComponent.clearAllFilters();
    });
  });

  test('[34410] Delete registration with status "Paused"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV8],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await changeRegistrationStatus({
      programId: programIdPV,
      referenceIds: [registrationsPvStatusChange.registrationPV8.referenceId],
      status: RegistrationStatusEnum.paused,
      accessToken,
    });

    await setupTestEnvironment();

    await test.step('Delete registration with status "Paused"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        selectByStatus: true,
        registrationStatus: RegistrationStatusEnum.paused,
        status: 'Delete',
        sendMessage: false,
        selectAllRows: true,
      });
      await registrations.validateToastMessageAndClose(
        deleteStatusToastMessage,
      );
    });
    // Assert
    await test.step('Validate registration was deleted succesfully', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV8.fullName,
      });
      await tableComponent.assertEmptyTableState();
      await tableComponent.clearAllFilters();
    });
  });

  test('[31223] Delete registration with status "Validated"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await seedRegistrationsWithStatus(
      [registrationsPvStatusChange.registrationPV10],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.validated,
    );

    await setupTestEnvironment();
    // Act
    await test.step('Delete registration with status "Validated"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        selectByStatus: true,
        registrationStatus: RegistrationStatusEnum.validated,
        status: 'Delete',
        sendMessage: false,
        selectAllRows: true,
      });
      await registrations.validateToastMessageAndClose(
        deleteStatusToastMessage,
      );
    });
    // Assert
    await test.step('Validate registration was deleted succesfully', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationsPvStatusChange.registrationPV10.fullName,
      });
      await tableComponent.assertEmptyTableState();
      await tableComponent.clearAllFilters();
    });
  });
});
