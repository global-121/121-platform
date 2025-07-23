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
  registrationPV5,
  registrationPV6,
  registrationPV7,
  registrationPV8,
  registrationPV9,
  registrationPV10,
  registrationPV11,
  registrationPV12,
  registrationPV13,
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

  // test.afterAll(async () => {
  //   await page.close();
  // });

  // Act and Assert
  test('[35840] Change status of registration with custom message', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV5],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();
    await registrations.deselectAllRegistrations();

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
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV6],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

    await test.step('Change status of first selected registration and do not write a custom message', async () => {
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
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV7],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

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
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV8],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

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
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPvMaxPayment],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );
    // Make payment to change status to "Completed"
    await doPayment({
      programId: 2,
      paymentNr: 1,
      amount: 25,
      referenceIds: [],
      accessToken,
    });

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

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
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV9],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.declined,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

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
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV10],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

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
      await tableComponent.clearAllFilters();
    });
  });

  test('[34408] Delete registration with status "New"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV11],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

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
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'New',
      });
      await tableComponent.assertEmptyTableState();
      await tableComponent.clearAllFilters();
    });
  });

  test('[34410] Delete registration with status "Paused"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV12],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await changeRegistrationStatus({
      programId: programIdPV,
      referenceIds: [registrationPV12.referenceId],
      status: RegistrationStatusEnum.paused,
      accessToken,
    });

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

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
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Paused',
      });
      await tableComponent.assertEmptyTableState();
    });
  });

  test('[31223] Delete registration with status "Validated"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV13],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.validated,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();
    // Act
    await test.step('Delete registration with status "Validated"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPV13.fullName,
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
        selection: 'Validated',
      });
      await tableComponent.assertEmptyTableState();
    });
  });
});
