import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPaymentAndWaitForCompletion } from '@121-service/test/helpers/registration.helper';
import {
  programIdOCW,
  registrationsVisa,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const transferValueForSecondPayment = 10;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  const { accessToken } = await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedPaidRegistrations: true,
    transferValue: 25,
    registrations: registrationsVisa,
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/registrations`,
  });

  // do 2nd payment
  await doPaymentAndWaitForCompletion({
    programId: programIdOCW,
    transferValue: transferValueForSecondPayment,
    referenceIds: registrationsVisa.map((reg) => reg.referenceId),
    accessToken,
  });
});

test('Validate second payment is correctly displayed on payment card', async ({
  paymentsPage,
}) => {
  const numberOfPas = registrationsVisa.length;
  const defaultMaxTransferValue = registrationsVisa.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * transferValueForSecondPayment;
  }, 0);
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to payments', async () => {
    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Validate 2nd payment card', async () => {
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulPaymentAmount: defaultMaxTransferValue,
      failedTransactions: 0,
      programId: programIdOCW,
      paymentId: 2,
    });
  });
});
