import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import {
  programIdPV,
  registrationsPvExcel,
} from '@121-service/test/registrations/pagination/pagination-data';

import ExportData from '@121-e2e/portal/components/ExportData';
import { test } from '@121-e2e/portal/fixtures/fixture';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

// Export Excel FSP payment list
const amount = NLRCProgramPV.fixedTransferValue;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPvExcel,
    programId: programIdPV,
    navigateToPage: `/en-GB/program/${programIdPV}/payments`,
  });
});

test('Do payment for excel fsp', async ({ page }) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const exportDataComponent = new ExportData(page);

  const numberOfPas = registrationsPvExcel.length;
  const defaultTransferValue = amount;
  const defaultMaxTransferValue = registrationsPvExcel.reduce((output, pa) => {
    return output + pa.paymentAmountMultiplier * defaultTransferValue;
  }, 0);
  const fsps: string[] = ['Excel Payment Instructions'];

  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Create payment', async () => {
    await paymentsPage.createPayment({});
    await paymentsPage.validateExcelFspInstructions();
    await paymentsPage.validatePaymentSummary({
      fsp: fsps,
      registrationsNumber: numberOfPas,
      currency: '€',
      paymentAmount: defaultMaxTransferValue,
    });
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdPV}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
    await paymentPage.approvePayment();
    await paymentPage.startPayment();
  });

  await test.step('Download payment instructions', async () => {
    await paymentPage.selectPaymentExportOption({
      option: 'Export FSP payment list',
    });
    await exportDataComponent.exportAndAssertData({
      exactRowCount: 4,
    });
  });
});
