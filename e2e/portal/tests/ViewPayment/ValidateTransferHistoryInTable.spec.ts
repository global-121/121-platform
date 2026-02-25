import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const registrationIds = ['Reg. #1', 'Reg. #2', 'Reg. #3', 'Reg. #4', 'Reg. #5'];
console.log('registrationIds: ', registrationIds);

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
  console.log('lastPaymentDate: ', lastPaymentDate);

  await test.step('Validate transfer history for Albert Heijn voucher WhatsApp FSP', async () => {
    // Apply filter for FSP
    await paymentPage.table.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: 'Albert Heijn voucher WhatsApp',
    });
    await paymentPage.table.validateWaitForTableRowCount({
      expectedRowCount: 1,
    });
    await paymentPage.rightClickAction('Transfer history');
    // Assert
    await paymentPage.validateTransferHistoryDialog({
      title: `Transaction ${lastPaymentDate}`,
    });
  });
});
