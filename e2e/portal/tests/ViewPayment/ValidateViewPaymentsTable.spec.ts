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

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
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
  await resetDB(SeedScript.nlrcMultiple);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, programIdOCW, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[32298] Table should be a filtered list of registrations included in the transfer', async ({
  page,
}) => {
  const paymentsPage = new PaymentsPage(page);
  const table = new TableComponent(page);
  const projectTitle = NLRCProgram.titlePortal.en;
  const lastPaymentDate = `${format(new Date(), 'dd/MM/yyyy')}`;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(projectTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment();
    await paymentsPage.startPayment();
    // Assert redirection to payment overview page
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${programIdOCW}/payments/1`),
    );
    // Assert payment overview page by payment date/ title
    await paymentsPage.validatePaymentsDetailsPageByDate(lastPaymentDate);
  });

  await test.step('Validate payment table', async () => {
    // Validate sorting of columns
    await table.sortAndValidateColumnByName('Reg.');
    await table.sortAndValidateColumnByName('Name');
    await table.sortAndValidateColumnByName('Registration status');
    await table.sortAndValidateColumnByName('Transfer status');
    await table.sortAndValidateColumnByName('Reason');
    await table.sortAndValidateColumnByName('Transfer value');
    await table.sortAndValidateColumnByName('FSP');

    // Validate applied sorting filters for Registration IDs
    await table.validateSortingOfColumns(
      'Reg.',
      2,
      ascedingRegistrationIds,
      descedingRegistrationIds,
    );

    // Validate applied sorting filters for Name column
    await table.validateSortingOfColumns(
      'Name',
      3,
      ascedingNames,
      descedingNames,
    );

    // Apply filter for Transfer value
    await table.filterColumnByText('Transfer value', '75');
    await table.validateTableRowCount(2);

    // Reset filters
    await table.clearAllFilters();

    // Apply filter for FSP
    await table.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: 'Albert Heijn voucher WhatsApp',
    });
    await table.validateTableRowCount(1);
  });
});
