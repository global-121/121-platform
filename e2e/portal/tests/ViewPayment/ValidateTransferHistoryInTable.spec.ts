import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const expectedTableValuesVoucher = new Map([
  ['AH message delivery', '121 system'],
  ['AH voucher-is-ready message dispatch', 'admin@example.org'],
  ['AH voucher message dispatch', '121 system'],
  ['AH voucher creation', 'admin@example.org'],
  ['Transaction started', 'admin@example.org'],
  ['Transaction approval', 'admin@example.org'],
  ['Transaction created', 'admin@example.org'],
]);
const expectedTableValuesVisa = new Map([
  ['Visa payment request', 'admin@example.org'],
  ['Transaction started', 'admin@example.org'],
  ['Transaction approval', 'admin@example.org'],
  ['Transaction created', 'admin@example.org'],
]);

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedPaidRegistrations: true,
    registrations: registrationsOCW,
    programId: programIdOCW,
    navigateToPage: `/program/${programIdOCW}/payments/1`,
  });
});

test('Transfer History displays correct values in payment table', async ({
  paymentPage,
}) => {
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to transfer history for Albert Heijn voucher WhatsApp FSP', async () => {
    // Apply filter for FSP
    await paymentPage.table.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: 'Albert Heijn voucher WhatsApp',
    });
    await paymentPage.table.validateWaitForTableRowCount({
      expectedRowCount: 1,
    });
    await paymentPage.rightClickAction({ action: 'Transfer history' });

    await paymentPage.validateTransferHistoryDialog({
      title: `Transaction ${lastPaymentDate}`,
    });
  });

  await test.step('Validate values in transfer history table of Albert Heijn voucher WhatsApp FSP', async () => {
    await paymentPage.validateTransactionHistoryTableValues({
      expectedValues: expectedTableValuesVoucher,
    });
  });

  await test.step('Navigate to Visa debit card FSP', async () => {
    await paymentPage.closeDialog();
    await paymentPage.table.clearAllFilters();
    // Apply filters for FSP and registration ID
    await paymentPage.table.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: 'Visa debit card',
    });
    await paymentPage.table.validateWaitForTableRowCount({
      expectedRowCount: 4,
    });
    await paymentPage.rightClickAction({ action: 'Transfer history', row: 1 });
  });

  await test.step('Validate values in transfer history table of Visa debit card FSP', async () => {
    await paymentPage.validateTransferHistoryDialog({
      title: `Transaction ${lastPaymentDate}`,
    });
    await paymentPage.validateTransactionHistoryTableValues({
      expectedValues: expectedTableValuesVisa,
    });
  });
});
