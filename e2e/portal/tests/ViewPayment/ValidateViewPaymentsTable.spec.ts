import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

const registrationIds = ['Reg. #1', 'Reg. #2', 'Reg. #3', 'Reg. #4', 'Reg. #5'];
const ascedingRegistrationIds = [...registrationIds].sort((a, b) =>
  a.localeCompare(b),
);
const descedingRegistrationIds = [...registrationIds].sort((a, b) =>
  b.localeCompare(a),
);

const names = [
  'Anna Hello',
  'John Smith',
  'Lars Larsson',
  'Luiz Garcia',
  'Sophia Johnson',
];

const ascedingNames = [...names].sort((a, b) => a.localeCompare(b));
const descedingNames = [...names].sort((a, b) => b.localeCompare(a));

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, programIdOCW, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Table should be a filtered list of registrations included in the transfer', async ({
  page,
}) => {
  const paymentPage = new PaymentPage(page);
  const paymentsPage = new PaymentsPage(page);
  const programTitle = NLRCProgram.titlePortal.en;
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(programTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({});
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdOCW}/payments/1`),
    );
    await paymentPage.startPayment();
    // Assert payment overview page by payment date/ title
    await paymentPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Validate payment table', async () => {
    // Validate sorting of columns
    await paymentPage.table.sortAndValidateColumnByName('Reg.');
    await paymentPage.table.sortAndValidateColumnByName('Name');
    await paymentPage.table.sortAndValidateColumnByName('Registration status');
    await paymentPage.table.sortAndValidateColumnByName('Transfer status');
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

    // Validate applied sorting filters for Name column
    await paymentPage.table.validateSortingOfColumns(
      'Name',
      3,
      ascedingNames,
      descedingNames,
    );

    // Apply filter for Transfer value
    await paymentPage.table.filterColumnByText({
      columnName: 'Transfer value',
      filterText: '75',
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
