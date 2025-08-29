import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProjectPV from '@121-service/src/seed-data/project/project-nlrc-pv.json';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, projectIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[29337] Export all People Affected data changes', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);
  const exportDataComponent = new ExportData(page);

  const projectTitle = NLRCProjectPV.titlePortal.en;

  await test.step('Select project', async () => {
    await registrationsPage.selectProject(projectTitle);
  });

  await test.step('Export list and validate XLSX files downloaded', async () => {
    await registrationsPage.selectAllRegistrations();
    await registrationsPage.clickAndSelectExportOption('Status & data changes');
    await exportDataComponent.exportAndAssertData({
      excludedColumns: ['changedAt'],
    });
  });
});
