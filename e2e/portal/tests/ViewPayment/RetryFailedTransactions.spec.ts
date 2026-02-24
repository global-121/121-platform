import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { updateRegistration } from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW6Fail,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;
const paymentPageUrl = `/en-GB/program/${programIdOCW}/payments/1`;
const registrations = [...registrationsOCW, registrationOCW6Fail];

test.beforeEach(
  async ({ paymentsPage, paymentPage, resetDBAndSeedRegistrations, page }) => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: [...registrationsOCW, registrationOCW6Fail],
      programId: programIdOCW,
      navigateToPage: `/program/${programIdOCW}/payments`,
    });

    await paymentsPage.createPayment({});
    await page.waitForURL((url) => url.pathname.startsWith(paymentPageUrl));
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  },
);

test('Retry failed transactions without filtering', async ({
  page,
  paymentPage,
}) => {
  await test.step('Check presence of retry button', async () => {
    await paymentPage.waitForPaymentToComplete();
    // Leaving this for now
    // My assumption is that there are a lot of jobs running in the background and for the test to retry the failed transactions correctly we need to re-navigate to payment overview page
    await page.goto(paymentPageUrl, {
      waitUntil: 'networkidle',
    });
    await paymentPage.validateRetryFailedTransactionsButtonToBeVisible();
  });

  await test.step('Retry payment with correct PA values', async () => {
    const accessToken = await getAccessToken();

    await updateRegistration(
      programIdOCW,
      registrationOCW6Fail.referenceId,
      { fullName: 'John Doe' },
      'automated test',
      accessToken,
    );

    await paymentPage.retryFailedTransactions({
      totalTransactions: registrations.length,
      failedTransactions: 1,
      filterFirst: false,
    });
  });

  await test.step('Check presence of retry button', async () => {
    await paymentPage.validateRetryFailedTransactionsButtonToBeHidden();
  });
});

test('Retry failed transactions with filtering on failed transactions', async ({
  paymentPage,
  page,
}) => {
  await test.step('Check presence of retry button', async () => {
    await paymentPage.waitForPaymentToComplete();
    // Leaving this for now
    // My assumption is that there are a lot of jobs running in the background and for the test to retry the failed transactions correctly we need to re-navigate to payment overview page
    await page.goto(paymentPageUrl, {
      waitUntil: 'networkidle',
    });
    await paymentPage.validateRetryFailedTransactionsButtonToBeVisible();
  });

  await test.step('Retry payment with correct PA values', async () => {
    const accessToken = await getAccessToken();

    await updateRegistration(
      programIdOCW,
      registrationOCW6Fail.referenceId,
      { fullName: 'John Doe' },
      'automated test',
      accessToken,
    );

    // retry with filtering on 'failed' transactions first
    await paymentPage.retryFailedTransactions({
      totalTransactions: registrations.length,
      failedTransactions: 1,
      filterFirst: true,
    });
  });

  await test.step('Check presence of retry button', async () => {
    await paymentPage.validateRetryFailedTransactionsButtonToBeHidden();
  });
});
