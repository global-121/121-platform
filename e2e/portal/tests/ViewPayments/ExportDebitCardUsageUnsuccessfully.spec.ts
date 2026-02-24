import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPV5],
    programId: programIdPV,
    seedPaidRegistrations: true,
    navigateToPage: `/program/${programIdPV}/payments`,
  });
});

test('Export debit card usage unsuccessfully', async ({
  paymentsPage,
  exportDataComponent,
}) => {
  // Act
  await paymentsPage.selectPaymentExportOption({ option: 'Debit card usage' });
  // Click on Proceed button
  await exportDataComponent.clickProceedToExport();

  // Assert
  await paymentsPage.validateExportMessage({
    message: 'There is currently no data to export',
  });
});
