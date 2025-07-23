import { type Page, test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPayment } from '@121-service/test/helpers/program.helper';
import {
  seedRegistrations,
  seedRegistrationsWithStatus,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
  registrationPV6,
  registrationPV7,
  registrationPvMaxPayment,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const declineStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Declined" successfully\. The status change can take up to a minute to process\./;
const includeStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Included" successfully\. The status change can take up to a minute to process\./;
const deleteStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Deleted" successfully\. The status change can take up to a minute to process\./;
const customMessage =
  'Test custom message to change the status of registration';

// Arrange
test.describe('Change status of registration with different status transitions', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    const accessToken = await getAccessToken();

    await seedRegistrations([registrationPV5, registrationPV6], programIdPV);
    await seedRegistrationsWithStatus(
      [registrationPvMaxPayment],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );
    await seedRegistrationsWithStatus(
      [registrationPV7],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.declined,
    );
    // Make payment to change status to "Completed"
    await doPayment({
      programId: 2,
      paymentNr: 1,
      amount: 25,
      referenceIds: [],
      accessToken,
    });

    page = await browser.newPage();
    const loginPage = new LoginPage(page);
    await page.goto(`/`);
    await loginPage.login(
      env.USERCONFIG_121_SERVICE_EMAIL_ADMIN ?? '',
      env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN ?? '',
    );
    // Navigate to program
    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
  });

  test.afterEach(async () => {
    const registrations = new RegistrationsPage(page);

    await registrations.navigateToProgramPage('Registrations');
    await page.reload();
  });

  // test.afterAll(async () => {
  //   await page.close();
  // });

  // Act and Assert
  test('[35840] Change status of registration with custom message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await test.step('Change status of first selected registration and write a custom message', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPV5.fullName,
        status: 'Decline',
        sendMessage: true,
        sendCustomMessage: true,
        customMessage,
      });
      await page.waitForTimeout(1000);
      await registrations.validateToastMessageAndClose(
        declineStatusToastMessage,
      );
    });

    await test.step('Find and validate custom message', async () => {
      await registrations.goToRegistrationByName({
        registrationName: registrationPV5.fullName,
      });
      await tableComponent.validateMessageActivityByTypeAndText({
        notificationType: 'Custom message',
      });
    });
  });

  test('[35849] Change status of registration without custom message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    await test.step('Change status of first selected registration and write a custom message', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPV6.fullName,
        status: 'Decline',
        sendMessage: false,
      });
      await page.waitForTimeout(1000);
      await registrations.validateToastMessageAndClose(
        declineStatusToastMessage,
      );
    });

    await test.step('Find and validate custom message not present', async () => {
      await registrations.goToRegistrationByName({
        registrationName: registrationPV6.fullName,
      });
      await tableComponent.validateActivityNotPresentByType('Custom message');
    });
  });

  test('[35912] Change status of registration with templated message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    await test.step('Change status of first selected registration and send templated message', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPV5.fullName,
        status: 'Include',
        sendMessage: true,
        sendTemplatedMessage: true,
      });
      await page.waitForTimeout(1000);
      await registrations.validateToastMessageAndClose(
        includeStatusToastMessage,
      );
    });

    await test.step('Find and validate templated message', async () => {
      await registrations.goToRegistrationByName({
        registrationName: registrationPV5.fullName,
      });
      await tableComponent.validateMessageActivityByTypeAndText({
        notificationType: 'Inclusion',
      });
    });
  });

  test('[35913] Change status of registration without templated message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    // Act
    await test.step('Change status of first selected registration without templated message', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPV6.fullName,
        status: 'Include',
        sendMessage: false,
      });
      await page.waitForTimeout(1000);
      await registrations.validateToastMessageAndClose(
        includeStatusToastMessage,
      );
    });

    await test.step('Find and validate templated message not present', async () => {
      await registrations.goToRegistrationByName({
        registrationName: registrationPV6.fullName,
      });
      await tableComponent.validateActivityNotPresentByType('Inclusion');
    });
  });

  test('[34411] Delete registration with status "Completed"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    // Act
    await test.step('Delete registration with status "Completed"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPvMaxPayment.fullName,
        status: 'Delete',
        sendMessage: false,
      });
      await registrations.validateToastMessageAndClose(
        deleteStatusToastMessage,
      );
    });
    // Assert
    await test.step('Validate registration was deleted succesfully', async () => {
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Completed',
      });
      await tableComponent.assertEmptyTableState();
      await tableComponent.clearAllFilters();
    });
  });

  test('[34412] Delete registration with status "Declined"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);

    // Act
    await test.step('Delete registration with status "Declined"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        selectByStatus: true,
        registrationStatus: RegistrationStatusEnum.declined,
        status: 'Delete',
        sendMessage: false,
      });
      await registrations.validateToastMessageAndClose(
        deleteStatusToastMessage,
      );
    });
    // Assert
    await test.step('Validate registration was deleted succesfully', async () => {
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: RegistrationStatusEnum.declined,
      });
      await tableComponent.assertEmptyTableState();
      await tableComponent.clearAllFilters();
    });
  });

  test('[34409] Delete registration with status "Included"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    // Act
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
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Included',
      });
      await tableComponent.assertEmptyTableState();
    });
  });
});
