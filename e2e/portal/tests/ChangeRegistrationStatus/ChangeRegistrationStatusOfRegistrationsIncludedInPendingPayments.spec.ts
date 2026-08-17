import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultipleMock,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/payments`,
  });
});

test('Show warning dialog when declining registrations included in pending payments', async ({
  page,
  paymentsPage,
  paymentPage,
}) => {
  // Prepare
  await test.step('Create payment with registrations"', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdPV}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentDetailsPageTitle();
    await paymentPage.approvePayment();
  });

  // Act
  // await test.step('Decline x registrations that are included in a pending payment"', async () => {});

  // Assert
  // await test.step('Validate warning dialog is shown"', async () => {});
});

// test('Show warning dialog when pausing registrations included in pending payments', async () => {
//   // Prepare
//   await test.step('Delete registration with status "Validated"', async () => {});

//   // Act
//   await test.step('Pauze x registrations that are included in a pending payment"', async () => {});

//   // Assert
//   await test.step('Validate warning dialog is shown"', async () => {});
// });
