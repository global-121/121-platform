import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getDefaultOCWRegistrations,
  programIdOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const registrations = getDefaultOCWRegistrations({ count: 4 });

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    programId: programIdOCW,
    registrations,
  });
});

test('Pause registrations included in pending payments', async ({
  registrationsPage,
  tableComponent,
  paymentsPage,
  paymentPage,
  page,
}) => {
  // Prepare
  await test.step('Create a payment with 3 registrations', async () => {
    await page.goto(`/en-GB/program/${programIdOCW}/payments`);
    await paymentsPage.createPayment({
      names: [
        registrations[0].fullName,
        registrations[1].fullName,
        registrations[2].fullName,
      ],
    });
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
    await paymentPage.validatePaymentDetailsPageTitle();
  });

  // Act
  await test.step('Pause 3 registrations, 2 included in a pending payment', async () => {
    await page.goto(`/en-GB/program/${programIdOCW}/registrations`);
    await tableComponent.changeRegistrationStatusByNameWithOptions({
      registrationNames: [
        registrations[1].fullName,
        registrations[2].fullName,
        registrations[3].fullName,
      ],
      status: 'Pause',
    });
  });

  // Assert
  await test.step('Validate warning modal is shown with correct numbers', async () => {
    await registrationsPage.validateStatusChangeWarningModal({
      warningMessage:
        "You're about to pause 2 registration(s) that are included in a payment that's waiting for approval.",
      proceedMessage: 'Would you like to proceed with 3 registration(s)?',
      submit: true,
    });
  });

  await test.step('Validate payment table shows 2 registrations are paused', async () => {
    // await paymentPage.validateTransactionTableStatusCount({
    //   status: 'Paused',
    //   count: 2,
    // });
  });
});
