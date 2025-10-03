import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import {
  doPayment,
  waitForPaymentTransactionsToComplete,
} from '@121-service/test/helpers/program.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
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
  await doPayment({
    programId: programIdOCW,
    amount: 25,
    referenceIds: registrationsVisa.map((reg) => reg.referenceId),
    accessToken,
  });
  await waitForPaymentTransactionsToComplete({
    programId: programIdOCW,
    paymentReferenceIds: registrationsVisa.map((reg) => reg.referenceId),
    accessToken,
    maxWaitTimeMs: 2_000,
  }); // wait for 1st payment to be processed
  // do 2nd payment
  await doPayment({
    programId: programIdOCW,
    amount: transferValueForSecondPayment,
    referenceIds: registrationsVisa.map((reg) => reg.referenceId),
    accessToken,
  });
  await waitForPaymentTransactionsToComplete({
    programId: programIdOCW,
    paymentReferenceIds: registrationsVisa.map((reg) => reg.referenceId),
    accessToken,
    maxWaitTimeMs: 2_000,
    paymentId: 2,
  }); // wait for 2nd payment to be processed

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[38338] Validate second payment is correctly displayed on payment card', async ({
  page,
}) => {
  const paymentsPage = new PaymentsPage(page);
  const projectTitle = NLRCProgram.titlePortal.en;
  const numberOfPas = registrationsVisa.length;
  const defaultMaxTransferValue = registrationsVisa.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * transferValueForSecondPayment;
  }, 0);
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to payments', async () => {
    await paymentsPage.selectProgram(projectTitle);
    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Validate 2nd payment card', async () => {
    await paymentsPage.validatePaymentCard({
      date: lastPaymentDate,
      paymentAmount: defaultMaxTransferValue,
      registrationsNumber: numberOfPas,
      successfulTransfers: defaultMaxTransferValue,
      failedTransfers: 0,
      projectId: 3,
      paymentId: 2,
    });
  });
});
