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

test('Payment can be deleted when payment is not approved', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  await test.step('Create payment', async () => {
    await paymentsPage.createPayment({});
    await paymentPage.validateToastMessageAndClose('Payment created');
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
  });

  await test.step('Verify delete payment button', async () => {
    await paymentPage.isDeletePaymentButtonVisible({ isVisible: true });
  });
});

test('Payment can be deleted when payment is not started', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  await test.step('Create payment and approve', async () => {
    await paymentsPage.createPayment({});
    await paymentPage.validateToastMessageAndClose('Payment created');
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
  });

  await test.step('Approve payment', async () => {
    await paymentPage.approvePayment();
    await paymentPage.validateToastMessageAndClose(
      'Payment approved successfully',
    );
    await paymentPage.validateBadgeIsPresentByLabel({
      badgeName: 'Approved',
      count: 1,
    });
    await paymentPage.validateButtonVisibility({
      isVisible: true,
      button: 'start',
    });
  });

  await test.step('Verify delete payment button', async () => {
    await paymentPage.isDeletePaymentButtonVisible({ isVisible: true });
  });
});

test('Payment cannot be deleted when payment has started', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  await test.step('Create payment', async () => {
    await paymentsPage.createPayment({});
    await paymentPage.validateToastMessageAndClose('Payment created');
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
  });

  await test.step('Approve payment', async () => {
    await paymentPage.approvePayment();
    await paymentPage.validateToastMessageAndClose(
      'Payment approved successfully',
    );
  });

  await test.step('Start payment', async () => {
    await paymentPage.startPayment();
    await paymentPage.validateToastMessageAndClose(
      'Payment started successfully',
    );
  });

  await test.step('Verify delete payment button', async () => {
    await paymentPage.isDeletePaymentButtonVisible({ isVisible: false });
  });
});

test('Deleting payment navigates back to payments overview and shows empty state', async ({
  page,
  paymentPage,
  paymentsPage,
}) => {
  await test.step('Create payment', async () => {
    await paymentsPage.createPayment({});
    await paymentPage.validateToastMessageAndClose('Payment created');
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
