import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDuplicateRegistrations } from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test('Show in progress banner and chip when payment is in progress', async ({
  paymentPage,
  paymentsPage,
  resetDBAndSeedRegistrations,
  page,
}) => {
  await test.step('Setup', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: [registrationOCW1],
      programId: programIdOCW,
      navigateToPage: `/program/${programIdOCW}/payments`,
    });

    await resetDuplicateRegistrations(8);
  });
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
    await page.waitForTimeout(500); // wait a bit to allow the payment to start with 2^8 registrations
  });

  await test.step('Validate payment in progress in Payment overview', async () => {
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: 'In progress',
      isVisible: true,
      count: 1,
    });
  });

  await test.step('Validate payemnt in progress in Payments page', async () => {
    await paymentPage.navigateToProgramPage('Payments');
    await paymentsPage.validateInProgressBannerIsPresent();
  });
});
