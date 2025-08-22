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
const currentDate = new Date();
const day = currentDate.getDate();
const month = currentDate.getMonth();
const year = currentDate.getFullYear();
const startDate = `${year}-${month}-${day}`;
const endDate = `${year}-${month}-${day}`;
const startDateFuture = `${year}-${month}-${day + 1}`;
const endDateFuture = `${year}-${month}-${day + 1}`;
const startDatePast = `${year}-${month}-${day - 1}`;
const endDatePast = `${year}-${month}-${day - 1}`;

// Arrange
test.describe('Export Payments with Date Range', () => {
  let page: Page;
  const projectTitle = 'NLRC OCW Program';

  test.beforeAll(async ({ browser }) => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    await seedPaidRegistrations([registrationOCW5], programIdOCW);

    page = await browser.newPage();
    // Login
    const loginPage = new LoginPage(page);
    await page.goto('/');
    await loginPage.login();
  });

  test.beforeEach(async () => {
    const paymentsPage = new PaymentsPage(page);

    await page.goto('/');
    await paymentsPage.selectProgram(projectTitle);
    await paymentsPage.navigateToProgramPage('Payments');
  });

  test('[37534] Export payments with date range - Current', async () => {
    const paymentsPage = new PaymentsPage(page);
    const exportDataComponent = new ExportData(page);

    await test.step('Validate export payment button', async () => {
      await paymentsPage.exportButton.waitFor({ state: 'visible' });
    });

    await test.step('Export and validate file', async () => {
      await paymentsPage.selectPaymentExportOption({
        option: 'Payments',
        withDateRange: true,
        dateRange: {
          start: startDate,
          end: endDate,
        },
      });

      await exportDataComponent.exportAndAssertData({
        exactRowCount: 1,
        excludedColumns: ['created', 'updated', 'paymentDate'],
        snapshotName: 'export-payments-current-date-range',
      });
    });
  });

  test('[37548] Export payments with date range - Future', async () => {
    const paymentsPage = new PaymentsPage(page);
    const exportDataComponent = new ExportData(page);

    await test.step('Validate export payment button', async () => {
      await paymentsPage.exportButton.waitFor({ state: 'visible' });
    });

    await test.step('Export and validate file', async () => {
      await paymentsPage.selectPaymentExportOption({
        option: 'Payments',
        withDateRange: true,
        dateRange: {
          start: startDateFuture,
          end: endDateFuture,
        },
      });

      await exportDataComponent.exportAndAssertData({
        exactRowCount: 0,
        snapshotName: 'export-payments-future-date-range',
      });
    });
  });

  test('[37549] Export payments with date range - Past', async () => {
    const paymentsPage = new PaymentsPage(page);
    const exportDataComponent = new ExportData(page);

    await test.step('Validate export payment button', async () => {
      await paymentsPage.exportButton.waitFor({ state: 'visible' });
    });

    await test.step('Export and validate file', async () => {
      await paymentsPage.selectPaymentExportOption({
        option: 'Payments',
        withDateRange: true,
        dateRange: {
          start: startDatePast,
          end: endDatePast,
        },
      });

      await exportDataComponent.exportAndAssertData({
        exactRowCount: 0,
        snapshotName: 'export-payments-past-date-range',
      });
    });
  });
});
