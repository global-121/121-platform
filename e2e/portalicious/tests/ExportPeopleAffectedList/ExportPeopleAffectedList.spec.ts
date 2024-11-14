import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';
import TableComponent from '@121-e2e/portalicious/pages/TableComponent';

// Export selected registrations
const status = 'included';
const id = 1;
const paymentAmountMultiplier = 1;
const preferredLanguage = 'nl';
const fspDisplayName = 'Albert Heijn voucher WhatsApp';

// Export status & data changes
const paId = 4;
const changedBy = 'admin@example.org';
const type = 'registrationStatusChange';
const newValue = 'included';
const oldValue = 'registered';

// Export duplicate registrations
const duplicateId = 2;
const duplicateStatus = 'included';
const fsp = 'Albert Heijn voucher WhatsApp';
const name = 'Jan Janssen';
const duplicateWithIds = '3';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdPV = 2;
  const pvProgramId = programIdPV;

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, pvProgramId, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[29358] Export People Affected list', async ({ page }) => {
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);
  const table = new TableComponent(page);

  const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

  await test.step('Select program', async () => {
    await basePage.selectProgram(projectTitle);
  });

  await test.step('Export list and validate XLSX file downloaded', async () => {
    await table.selectAllCheckbox();
    await registrations.clickAndSelectExportOption(
      'Export selected registrations',
    );
    await registrations.exportAndAssertSelectedRegistrations(0, {
      id,
      status,
      paymentAmountMultiplier,
      preferredLanguage,
      fspDisplayName,
    });

    await registrations.clickAndSelectExportOption(
      'Export status & data changes',
    );
    await registrations.exportAndAssertStatusAndDataChanges(0, {
      paId,
      changedBy,
      type,
      newValue,
      oldValue,
    });

    await registrations.clickAndSelectExportOption(
      'Export duplicate registrations',
    );
    await registrations.exportAndAssertDuplicates(0, {
      id: duplicateId,
      status: duplicateStatus,
      fsp,
      name,
      duplicateWithIds,
    });
  });
});
