import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsOCW,
    programId: programIdOCW,
    seedPaidRegistrations: true,
    navigateToPage: `/program/${programIdOCW}/payments`,
  });
});

test('Export debit card usage', async ({
  paymentsPage,
  exportDataComponent,
}) => {
  // Act
  await paymentsPage.selectPaymentExportOption({ option: 'Debit card usage' });

  // Assert
  await exportDataComponent.exportAndAssertData({
    minRowCount: 4,
    excludedColumns: ['issuedDate', 'cardNumber'],
  });
});
