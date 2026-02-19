import { format } from 'date-fns';
import path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPvExcel,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test('[Excel fsp]: Import reconciliation data should work similar to import registration data', async ({
  paymentPage,
  paymentsPage,
  resetDBAndSeedRegistrations,
  page,
}) => {
  await test.step('Setup', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPvExcel,
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/payments`,
    });
  });

  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;
  const reconciliationData = path.resolve(
    __dirname,
    '../../../test-registration-data/test-reconciliation-Excel-pv.csv',
  );

  await test.step('Start payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdPV}/payments/1`),
    );
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Upload payment reconciliation data via UI', async () => {
    await paymentPage.importReconciliationData(reconciliationData);
  });

  // ## TODO: this process downloads a file, assert that that happens and the content is correct
});
