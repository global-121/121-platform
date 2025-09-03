import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProjectPV from '@121-service/src/seed-data/project/project-nlrc-pv.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
  resetDuplicateRegistrations,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationPV8,
} from '@121-service/test/registrations/pagination/pagination-data';

import ExportData from '@121-e2e/portal/components/ExportData';
import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV8], projectIdPV, accessToken);
  await resetDuplicateRegistrations(14);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[29359] Export 15000 PAs', async ({ page }) => {
  const basePage = new BasePage(page);
  const registrationsPage = new RegistrationsPage(page);
  const exportDataComponent = new ExportData(page);

  const projectTitle = NLRCProjectPV.titlePortal.en;

  await test.step('Select project', async () => {
    await basePage.selectProject(projectTitle);
  });

  await test.step('Export list and validate XLSX file downloaded', async () => {
    await registrationsPage.selectAllRegistrations();
    await registrationsPage.clickAndSelectExportOption(
      'Selected registrations',
    );
    await exportDataComponent.exportAndAssertData({
      minRowCount: 15000,
      orderOfDataIsImportant: true,
      excludedColumns: ['phoneNumber', 'created'],
    });
  });
});
