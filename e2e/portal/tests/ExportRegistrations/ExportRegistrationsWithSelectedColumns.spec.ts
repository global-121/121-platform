import { type Page, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[37356] Export should only have selected columns', async () => {
  const registrationsPage = new RegistrationsPage(page);
  const exportDataComponent = new ExportData(page);

  const projectTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(projectTitle);
  });

  await test.step('Export list and validate XLSX files downloaded', async () => {
    // Configure columns to be exported
    await registrationsPage.deselectAllColumns();
    await registrationsPage.configureTableColumns([
      'FSP',
      'Address street',
      'Phone Number',
      'Name',
    ]);

    await registrationsPage.selectAllRegistrations();
    await registrationsPage.clickAndSelectExportOption(
      'Selected registrations',
    );
    await exportDataComponent.exportAndAssertData({});
  });

  await test.step('Export list and validate CSV files downloaded', async () => {
    await registrationsPage.dismissToast();
    await registrationsPage.clickAndSelectExportOption(
      'Selected registrations',
    );
    await exportDataComponent.exportAndAssertData({
      format: 'csv',
    });
  });
});
