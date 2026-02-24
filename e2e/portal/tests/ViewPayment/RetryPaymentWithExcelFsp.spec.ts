import { format } from 'date-fns';
import path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPvExcel,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPvExcel,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/payments`,
  });
});

test('Retry payments should put failed transactions back in processing and download the payment instructions file for those processing transactions', async ({
  paymentsPage,
  paymentPage,
  exportDataComponent,
  page,
}) => {
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;
  const reconciliationData = path.join(
    __dirname,
    '../../../test-registration-data/test-reconciliation-Excel-pv.csv',
  );

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdPV}/payments/1`),
    );
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Upload payment reconciliation data', async () => {
    await paymentPage.importReconciliationData(reconciliationData);
  });

  // TODO: this process downloads a file, assert that that happens and the content is correct
  await test.step('Retry payment, Export FSP payment data and assert file', async () => {
    await paymentPage.validateRetryFailedTransactionsButtonToBeVisible();
    // Timeout has to be used in this case because choose option is not visible immediately after the dropdown button is clicked
    await page.waitForTimeout(200);
    await paymentPage.retryFailedTransactions({
      totalTransactions: 4,
      failedTransactions: 2,
      filterFirst: true,
    });
    // Start download of the payment instructions file
    await paymentPage.selectPaymentExportOption({
      option: 'Export FSP payment list',
    });
    // Assert excel fsp list it should only include the failed transactions that were retried and are now in status 'processing'
    await exportDataComponent.exportAndAssertData({
      exactRowCount: 2,
    });
  });
});
