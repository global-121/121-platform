import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import CoopBank from '@121-service/src/seed-data/program/program-cooperative-bank-of-oromia.json';
import { startCooperativeBankOfOromiaValidationProcess } from '@121-service/test/helpers/program.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const coopBankProgramId = 1;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.cooperativeBankOfOromiaProgram, __filename);
  const accessToken = await getAccessToken();

  await startCooperativeBankOfOromiaValidationProcess(
    coopBankProgramId,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Export Coop Bank Empty verification report', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);
  const exportDataComponent = new ExportData(page);

  const programTitle = CoopBank.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(programTitle);
  });

  await test.step('Export list and validate XLSX file downloaded', async () => {
    await registrationsPage.clickAndSelectExportOption(
      'Coopbank verification report',
    );
    await exportDataComponent.exportAndAssertData();
  });
});
