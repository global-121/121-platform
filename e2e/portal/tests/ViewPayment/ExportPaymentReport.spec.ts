import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationOCW1,
  registrationOCW6Fail,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test('Export Payment Report should contain the right data', async ({
  paymentPage,
  paymentsPage,
  exportDataComponent,
  resetDBAndSeedRegistrations,
  page,
}) => {
  await test.step('Setup', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: [registrationOCW1, registrationOCW6Fail],
      programId: programIdOCW,
      navigateToPage: `/program/${programIdOCW}/payments`,
    });
  });

  for (let i = 1; i <= 2; i++) {
    // Do 2 payments to make sure that the export only contains the latest payment
    await test.step(`Do payment ${i}`, async () => {
      await paymentsPage.navigateToProgramPage('Payments');

      await paymentsPage.createPayment({});
      // Assert redirection to payment overview page
      await page.waitForURL((url) =>
        url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/${i}`),
      );
      await paymentPage.approvePayment();
      await paymentPage.startPayment();
      await paymentPage.waitForPaymentToComplete();
    });
  }

  await test.step('Export Payment Report', async () => {
    await paymentPage.selectPaymentExportOption({
      option: 'Payment report',
    });

    await exportDataComponent.exportAndAssertData({
      exactRowCount: 2,
      excludedColumns: ['paymentDate', 'created', 'updated'],
    });
  });
});
