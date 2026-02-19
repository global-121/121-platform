import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test('Table should reflect the actual transfer values sent to the PAs in this payment', async ({
  paymentPage,
  paymentsPage,
  resetDBAndSeedRegistrations,
  page,
}) => {
  await test.step('Setup', async () => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsOCW,
      programId: programIdOCW,
      navigateToPage: `/program/${programIdOCW}/payments`,
    });
  });
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  const defaultTransferValue = NLRCProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
    await paymentPage.approvePayment();
    await paymentPage.startPayment();

    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Validate transfer value after "payment in progress" chip disappears in Payment overview', async () => {
    await paymentPage.waitForPaymentToComplete();
    await paymentPage.validateTransferValues({
      amount: defaultMaxTransferValue,
    });
  });
});
