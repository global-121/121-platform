import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDuplicateRegistrations } from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW1,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationOCW1],
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });

  await resetDuplicateRegistrations(8);
});

test('Show in progress banner and chip when payment is in progress', async ({
  paymentPage,
  paymentsPage,
  page,
}) => {
  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
    await paymentPage.approvePayment();
    await paymentPage.validateToastMessageAndClose('Payment approved');
    await paymentPage.startPayment();
    await paymentPage.validateToastMessageAndClose('Payment started');
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentDetailsPageTitle();
  });

  await test.step('Validate payment in progress in Payment overview', async () => {
    // @TODO: To be honest, the way we check this thing is brittle...
    // There are chips all over the place on this page, it should be better
    // For example, the header chip says approved, but the chip inside the registrations
    // metric tile says in progress. I don't understand why it was put there..
    const inProgressChip = page
      .getByTestId('metric-tile-chip')
      .filter({ hasText: 'In progress' });
    await expect(inProgressChip).toBeVisible();
  });

  await test.step('Validate payemnt in progress in Payments page', async () => {
    await paymentPage.navigateToProgramPage('Payments');
    await paymentsPage.validateInProgressBannerIsPresent();
  });
});
