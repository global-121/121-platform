import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationOCW5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

// Get current date information
// TODO: use library (date-fns) here (e2e-wide)
const currentDate = new Date();
const futureDate = new Date(currentDate);
futureDate.setDate(currentDate.getDate() + 1);
const pastDate = new Date(currentDate);
pastDate.setDate(currentDate.getDate() - 1);

// Arrange
test.describe('Export Payments with Date Range', () => {
  test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      seedPaidRegistrations: true,
      registrations: [registrationOCW5],
      programId: programIdOCW,
      navigateToPage: `/program/${programIdOCW}/payments`,
    });
  });

  test('Export payments with date range - Current', async ({
    paymentsPage,
    exportDataComponent,
  }) => {
    await test.step('Validate export payment button', async () => {
      await paymentsPage.exportButton.waitFor({ state: 'visible' });
    });

    await test.step('Export and validate file', async () => {
      await paymentsPage.selectPaymentExportOption({
        option: 'Payments',
        dateRange: {
          start: currentDate,
          end: currentDate,
        },
      });

      await exportDataComponent.exportAndAssertData({
        exactRowCount: 1,
        excludedColumns: ['created', 'updated', 'paymentDate'],
        snapshotName: 'export-payments-current-date-range',
      });
    });
  });

  test('Export payments with date range - Future', async ({
    paymentsPage,
    exportDataComponent,
  }) => {
    await test.step('Validate export payment button', async () => {
      await paymentsPage.exportButton.waitFor({ state: 'visible' });
    });

    await test.step('Export and validate file', async () => {
      await paymentsPage.selectPaymentExportOption({
        option: 'Payments',
        dateRange: {
          start: futureDate,
          end: futureDate,
        },
      });

      await exportDataComponent.exportAndAssertData({
        exactRowCount: 0,
        snapshotName: 'export-payments-future-date-range',
      });
    });
  });

  test('Export payments with date range - Past', async ({
    paymentsPage,
    exportDataComponent,
  }) => {
    await test.step('Validate export payment button', async () => {
      await paymentsPage.exportButton.waitFor({ state: 'visible' });
    });

    await test.step('Export and validate file', async () => {
      await paymentsPage.selectPaymentExportOption({
        option: 'Payments',
        dateRange: {
          start: pastDate,
          end: pastDate,
        },
      });

      await exportDataComponent.exportAndAssertData({
        exactRowCount: 0,
        snapshotName: 'export-payments-past-date-range',
      });
    });
  });
});
