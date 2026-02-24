import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { triggerUnusedVouchersCache } from '@121-service/test/helpers/fsp-specific.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations, accessToken }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedPaidRegistrations: true,
    transferValue: 12.5,
    registrations: [registrationPV5],
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/payments`,
  });
  // Run cronJob to process unused vouchers
  await triggerUnusedVouchersCache(accessToken);
});

test('Export unused vouchers successfully', async ({
  paymentsPage,
  exportDataComponent,
}) => {
  // Act
  await paymentsPage.selectPaymentExportOption({ option: 'Unused vouchers' });

  // Assert
  await exportDataComponent.exportAndAssertData({
    minRowCount: 1,
    excludedColumns: ['issueDate', 'lastExternalUpdate'],
  });
});
