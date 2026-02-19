import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const registrationIds = ['Reg. #1', 'Reg. #2', 'Reg. #3', 'Reg. #4', 'Reg. #5'];
const ascedingRegistrationIds = [...registrationIds].sort((a, b) =>
  a.localeCompare(b),
);
const descedingRegistrationIds = [...registrationIds].sort((a, b) =>
  b.localeCompare(a),
);

test('Table should be a filtered list of registrations included in the transaction', async ({
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

  await test.step('Validate payment table', async () => {
    // Validate sorting of columns
    await paymentPage.table.sortAndValidateColumnByName('Reg.');
    await paymentPage.table.sortAndValidateColumnByName('Registration status');
    await paymentPage.table.sortAndValidateColumnByName('Transaction status');
    await paymentPage.table.sortAndValidateColumnByName('Reason');
    await paymentPage.table.sortAndValidateColumnByName('Transfer value');
    await paymentPage.table.sortAndValidateColumnByName('FSP');

    // Validate applied sorting filters for Registration IDs
    await paymentPage.table.validateSortingOfColumns(
      'Reg.',
      2,
      ascedingRegistrationIds,
      descedingRegistrationIds,
    );

    // Apply filter for Transfer value
    await paymentPage.table.filterColumnByNumber({
      columnName: 'Transfer value',
      filterNumber: 75,
    });
    await paymentPage.table.validateWaitForTableRowCount({
      expectedRowCount: 2,
    });

    // Reset filters
    await paymentPage.table.clearAllFilters();

    // Apply filter for FSP
    await paymentPage.table.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: 'Albert Heijn voucher WhatsApp',
    });
    await paymentPage.table.validateWaitForTableRowCount({
      expectedRowCount: 1,
    });
  });
});
