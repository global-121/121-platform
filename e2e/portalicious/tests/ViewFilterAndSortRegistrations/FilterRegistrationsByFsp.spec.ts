import { test } from '@playwright/test';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedRegistrationsWithStatus } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import TableComponent from '@121-e2e/portalicious/components/TableComponent';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

let registrationName: string;
const ahVoucherFsp = 'Albert Heijn voucher WhatsApp';
const visaFsp = 'Visa debit card';

// Arrange
test.beforeEach(async ({ page }) => {
  const accessToken = await getAccessToken();
  await resetDB(SeedScript.nlrcMultiple);

  await seedRegistrationsWithStatus(
    registrationsPV,
    programIdPV,
    accessToken,
    RegistrationStatusEnum.included,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
  // Navigate to program
  await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
});

test('[34949] Filter registrations by FSP (from the bug)', async ({ page }) => {
  const registrations = new RegistrationsPage(page);
  const tableComponent = new TableComponent(page);
  // Act & Assert
  await test.step('Filter registrations columns by text', async () => {
    // Select FSP column to be displayed
    await registrations.manageTableColumns(['FSP']);
    // Filter FSP column by dropdown selection and Visa fsp
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: visaFsp,
    });
    // Get first name from table by name and assert that it includes correct fsp
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    await tableComponent.validateLabelInTableByRegistrationName(
      registrationName,
      visaFsp,
    );
    await tableComponent.validateAllRecordsCount(2);
    await tableComponent.clearAllFilters();
    // Filter FSP column by dropdown selection and AH voucher fsp
    await tableComponent.filterColumnByDropDownSelection({
      columnName: 'FSP',
      selection: ahVoucherFsp,
    });
    // Get first name from table by name and assert that it includes correct fsp
    registrationName = await registrations.getFirstRegistrationNameFromTable();
    await tableComponent.validateLabelInTableByRegistrationName(
      registrationName,
      ahVoucherFsp,
    );
    await tableComponent.validateAllRecordsCount(2);
  });
});
