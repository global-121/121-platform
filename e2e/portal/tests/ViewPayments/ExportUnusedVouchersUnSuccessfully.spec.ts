import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsVoucher,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedPaidRegistrations: true,
    transferValue: 100,
    registrations: registrationsVoucher,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/payments`,
  });
});

test('Export unused vouchers unsuccessfully', async ({
  paymentsPage,
  exportDataComponent,
}) => {
  // Act
  await paymentsPage.selectPaymentExportOption({ option: 'Unused vouchers' });
  // Click on Proceed button
  await exportDataComponent.clickProceedToExport();

  // Assert
  await paymentsPage.validateExportMessage({
    message: 'There is currently no data to export',
  });
});
