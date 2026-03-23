import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
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
});

test('Delete payment button is not visible when payment has started', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  await test.step('Create payment and process it to completion', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
  });

  await test.step('Verify delete payment button is not visible', async () => {
    await expect(page.getByTestId('ellipsis-menu-button')).toBeHidden();
  });
});

test('Delete payment navigates back to payments overview and shows empty state', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  await test.step('Create payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
  });

  await test.step('Delete payment', async () => {
    await paymentPage.deletePayment();
  });

  await test.step('Verify redirect to payments overview and empty state', async () => {
    await page.waitForURL((url) =>
      url.pathname.endsWith(`/program/${programIdOCW}/payments`),
    );
    const isEmpty = await paymentsPage.isPaymentPageEmpty();
    expect(isEmpty).toBe(true);
  });
});
