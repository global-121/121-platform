import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const programIdOCW = 3;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsOCW,
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });
});

test('Show payment summary', async ({ paymentsPage }) => {
  const fsps: string[] = ['Albert Heijn voucher WhatsApp', 'Visa debit card'];
  const numberOfPas = registrationsOCW.length;
  const defaultTransferValue = NLRCProgram.fixedTransferValue;
  const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);

  await test.step('Create payment', async () => {
    await paymentsPage.createPayment({});
    await paymentsPage.validatePaymentSummary({
      fsp: fsps,
      registrationsNumber: numberOfPas,
      currency: '€',
      paymentAmount: defaultMaxTransferValue,
    });
  });
});

test('Validate empty payment page', async ({ paymentsPage }) => {
  await test.step('Validate empty payment summary', async () => {
    const isEmpty = await paymentsPage.isPaymentPageEmpty();
    expect(isEmpty).toBe(true);
  });
});
