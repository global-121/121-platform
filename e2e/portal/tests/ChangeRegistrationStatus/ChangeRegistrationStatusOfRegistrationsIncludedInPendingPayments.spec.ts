import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
  registrationPV8,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(
  async ({ resetDBAndSeedRegistrations, page, paymentsPage, paymentPage }) => {
    // Prepare
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: [registrationPV5, registrationPV8],
      programId: programIdPV,
      navigateToPage: `/en-GB/program/${programIdPV}/payments`,
    });

    await test.step('Create a payment', async () => {
      await paymentsPage.createPayment({});
      await page.waitForURL((url) =>
        url.pathname.startsWith(`/en-GB/program/${programIdPV}/payments/1`),
      );
      await paymentPage.validatePaymentDetailsPageTitle();
      await paymentPage.approvePayment();
    });
  },
);

test('Pause registrations included in pending payments', async ({
  page,
  tableComponent,
}) => {
  // Act
  await test.step('Pause registrations included in the pending payment', async () => {
    await page.goto(`/en-GB/program/${programIdPV}/registrations`);
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationName: registrationPV5.fullName,
      status: 'Pause',
    });
  });

  // Assert
});
