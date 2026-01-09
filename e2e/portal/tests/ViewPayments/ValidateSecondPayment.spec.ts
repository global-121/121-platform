import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import {
  doPaymentAndWaitForCompletion,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationsVisa,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

const transferValueForSecondPayment = 10;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsVisa, programIdOCW, accessToken);
  // do 1st payment
  await doPaymentAndWaitForCompletion({
    programId: programIdOCW,
    transferValue: 25,
    referenceIds: registrationsVisa.map((reg) => reg.referenceId),
    accessToken,
  });

  // do 2nd payment
  await doPaymentAndWaitForCompletion({
    programId: programIdOCW,
    transferValue: transferValueForSecondPayment,
    referenceIds: registrationsVisa.map((reg) => reg.referenceId),
    accessToken,
  });

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Validate second payment is correctly displayed on payment card', async ({
  page,
}) => {
  const paymentsPage = new PaymentsPage(page);
  const programTitle = NLRCProgram.titlePortal.en;
  const numberOfPas = registrationsVisa.length;
  const defaultMaxTransferValue = registrationsVisa.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * transferValueForSecondPayment;
  }, 0);
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to payments', async () => {
    await paymentsPage.selectProgram(programTitle);
    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Validate 2nd payment card', async () => {
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulPaymentAmount: defaultMaxTransferValue,
      failedTransactions: 0,
      programId: 3,
      paymentId: 2,
    });
  });
});
