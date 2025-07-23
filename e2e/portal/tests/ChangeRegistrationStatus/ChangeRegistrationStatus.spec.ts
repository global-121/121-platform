import { type Page, test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  changeRegistrationStatus,
  seedRegistrationsWithStatus,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV,
  registrationPV1,
  registrationPV2,
  registrationPV3,
  registrationPV4,
  registrationPV5,
  registrationPV6,
  registrationPV7,
  registrationPV8,
  registrationPV9,
  registrationPV10,
  registrationPV11,
  registrationPV12,
  registrationPV13,
  registrationPV14,
  registrationPV15,
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
const pauseStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Paused" successfully\. The status change can take up to a minute to process\./;
const validateStatusToastMessage =
  /The status of \d+ registration\(s\) is being changed to "Validated" successfully\. The status change can take up to a minute to process\./;
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
        registrationName: registrationPV7.fullName,
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
        registrationName: registrationPV7.fullName,
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
        registrationName: registrationPV8.fullName,
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
        registrationName: registrationPV8.fullName,
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
      referenceIds: [registrationPvMaxPayment.referenceId],
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
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: RegistrationStatusEnum.declined,
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
      await tableComponent.clearAllFilters();
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
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Validated',
      });
      await tableComponent.assertEmptyTableState();
      await tableComponent.clearAllFilters();
    });
  });

  test('[31215] Move PA(s) from status "Completed" to "Declined"', async () => {
    const accessToken = await getAccessToken();
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV14],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Included',
      });
    });

    await test.step('Change status of registration to "Completed" with doing a payment', async () => {
      await doPayment({
        programId: 2,
        paymentNr: 1,
        amount: 25,
        referenceIds: [registrationPV14.referenceId],
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
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Declined',
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
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV15],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );
    // Make payment to change status to "Completed"
    await doPayment({
      programId: 2,
      paymentNr: 1,
      amount: 25,
      referenceIds: [registrationPV15.referenceId],
      accessToken,
    });

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

    await test.step('Validate the status of the registration', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationPV15.fullName,
      });
      await registrations.validateStatusOfFirstRegistration({
        status: 'Completed',
      });
      await tableComponent.clearAllFilters();
    });

    await test.step('Raise amount of max payments for the registration', async () => {
      await updateRegistration(
        2,
        registrationPV15.referenceId,
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
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: RegistrationStatusEnum.included,
      });
      await registrations.validateStatusOfFirstRegistration({
        status: 'Included',
      });
      await tableComponent.clearAllFilters();
    });
  });

  test('[31211] Move PA(s) from status "Included" to "Completed"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV4],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

    // Act
    await test.step('Validate the status of the registration', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationPV4.fullName,
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
        referenceIds: [registrationPV4.referenceId],
        accessToken,
      });
      // Wait for payment transactions to complete
      await waitForPaymentTransactionsToComplete({
        programId: programIdPV,
        paymentReferenceIds: [registrationPV4.referenceId],
        accessToken,
        maxWaitTimeMs: 4_000,
        completeStatusses: Object.values(TransactionStatusEnum),
      });
      // Wait for the page to reload to reflect the status change from the api call
      await page.reload();
    });

    await test.step('Search for the registration with status "Completed"', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationPV4.fullName,
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
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV3],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

    // Act
    await test.step('Change status of first selected registration to "Declined"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPV3.fullName,
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
        filterText: registrationPV3.fullName,
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
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV2],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.included,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();
    // Act
    await test.step('Change status of first selected registration to "Paused"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPV2.fullName,
        status: 'Pause',
        sendMessage: false,
      });
      await registrations.validateToastMessageAndClose(pauseStatusToastMessage);
    });

    await test.step('Search for the registration with status "Paused"', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationPV2.fullName,
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

  test('[31206] Move PA(s) from status "New" to "Validated"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV1],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.new,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();
    // Act
    await test.step('Change status of first selected registration to "Validated"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPV1.fullName,
        status: 'Validate',
        sendMessage: false,
      });
      await registrations.validateToastMessageAndClose(
        validateStatusToastMessage,
      );
    });

    await test.step('Search for the registration with status "Validated"', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationPV1.fullName,
      });
    });
    // Assert
    await test.step('Validate the status of the registration', async () => {
      await registrations.validateStatusOfFirstRegistration({
        status: 'Validated',
      });
      await tableComponent.clearAllFilters();
    });
  });

  test('[31220] Move PA(s) from status "Declined" to "Included"', async () => {
    const registrations = new RegistrationsPage(page);
    const tableComponent = new TableComponent(page);
    const loginPage = new LoginPage(page);

    await seedRegistrationsWithStatus(
      [registrationPV],
      programIdPV,
      accessToken,
      RegistrationStatusEnum.declined,
    );

    await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
    await registrations.navigateToProgramPage('Registrations');
    await registrations.deselectAllRegistrations();

    // Act
    await test.step('Search for the registration with status "Declined"', async () => {
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Registration Status',
        selection: 'Declined',
      });
    });

    await test.step('Change status of first selected registration to "Included"', async () => {
      await tableComponent.updateRegistrationStatusWithOptions({
        registrationName: registrationPV.fullName,
        status: 'Include',
        sendMessage: false,
      });
      await registrations.validateToastMessageAndClose(
        includeStatusToastMessage,
      );
      await tableComponent.clearAllFilters();
    });

    await test.step('Search for the registration with status "Included"', async () => {
      await tableComponent.filterColumnByText({
        columnName: 'Name',
        filterText: registrationPV.fullName,
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
