import { test } from '@playwright/test';

import { MessageContentType } from '@121-service/src/notifications/enum/message-type.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import {
  createAndStartPayment,
  waitForMessagesToComplete,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import {
  getAllActivitiesCount,
  seedIncludedRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const referenceIdPV5 = registrationPV5.referenceId;
let activitiesCount: number;

// Arrange
test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);

  const paymentResponse = await createAndStartPayment({
    programId: 2,
    transferValue: 100,
    referenceIds: [referenceIdPV5],
    accessToken,
  });
  const paymentId = paymentResponse.body.id;

  await waitForPaymentTransactionsToComplete({
    programId: programIdPV,
    paymentId,
    paymentReferenceIds: [referenceIdPV5],
    accessToken,
    maxWaitTimeMs: 2_000,
    completeStatusses: [
      TransactionStatusEnum.success,
      TransactionStatusEnum.waiting,
    ],
  });

  await updateRegistration(
    2,
    referenceIdPV5,
    {
      maxPayments: '2',
    },
    'automated test',
    accessToken,
  );

  await waitForMessagesToComplete({
    programId: programIdPV,
    referenceIds: [referenceIdPV5],
    accessToken,
    expectedMessageAttribute: {
      key: 'contentType',
      values: [MessageContentType.paymentInstructions], // Payment instruction is the last message sent when doing a payment with voucher
    },
  });

  activitiesCount = (
    await getAllActivitiesCount(programIdPV, referenceIdPV5, accessToken)
  ).totalCount;

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login();
});

test('[34462] Expand rows of activity overview and view transfer history', async ({
  page,
}) => {
  const activityLogPage = new RegistrationActivityLogPage(page);
  const tableComponent = new TableComponent(page);
  const registrationsPage = new RegistrationsPage(page);
  // Act
  await test.step('Navigate to registration activity log', async () => {
    await activityLogPage.selectProgram(NLRCProgram.titlePortal.en);
    await registrationsPage.goToRegistrationByName({
      registrationName: registrationPV5.fullName,
    });
  });

  // Assert
  await test.step('Expand all activity rows and assert that they are expanded', async () => {
    // Mitigate the timeout issue when the table is not fully loaded
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'Activity',
      selection: 'Transfer',
    });
    await tableComponent.clearAllFilters();
    // Validate amount of rows before expanding
    await tableComponent.validateWaitForTableRowCount({
      expectedRowCount: activitiesCount,
    });
    // Expand all rows
    await tableComponent.expandAllRows();
    // Validate amount of rows after expanding
    await tableComponent.validateWaitForTableRowCount({
      expectedRowCount: activitiesCount * 2,
    });
  });

  await test.step('View transfer history and validate table contents', async () => {
    // Click view transfer history button in first row
    await tableComponent.clickViewTransferHistoryButtonInRow();

    // Validate that transfer history table has correct number of rows
    await tableComponent.validateTransferHistoryTableRowCount({
      expectedRowCount: 6, // created / initiated / voucher created / initial message sent / voucher message sent / message delivered
    });
  });
});
