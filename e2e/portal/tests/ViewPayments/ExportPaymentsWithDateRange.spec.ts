import { Page, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationOCW5,
} from '@121-service/test/registrations/pagination/pagination-data';

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

// Get current date information
// TODO: use library (date-fns) here (e2e-wide)
const currentDate = new Date();
const futureDate = new Date(currentDate);
futureDate.setDate(currentDate.getDate() + 1);
const pastDate = new Date(currentDate);
pastDate.setDate(currentDate.getDate() - 1);

// Arrange
test.describe('Export Payments with Date Range', () => {
  let page: Page;
  const programTitle = 'NLRC OCW Program';

  test.beforeAll(async ({ browser }) => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    await seedPaidRegistrations({
      registrations: [registrationOCW5],
      programId: programIdOCW,
    });

    page = await browser.newPage();
    // Login
    const loginPage = new LoginPage(page);
    await page.goto('/');
    await loginPage.login();
  });

  test.beforeEach(async () => {
    const paymentsPage = new PaymentsPage(page);

    await page.goto('/');
    await paymentsPage.selectProgram(programTitle);
    await paymentsPage.navigateToProgramPage('Payments');
  });

  test('Export payments with date range - Current', async () => {
    const paymentsPage = new PaymentsPage(page);
    const exportDataComponent = new ExportData(page);

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

  test('Export payments with date range - Future', async () => {
    const paymentsPage = new PaymentsPage(page);
    const exportDataComponent = new ExportData(page);

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

  test('Export payments with date range - Past', async () => {
    const paymentsPage = new PaymentsPage(page);
    const exportDataComponent = new ExportData(page);

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
