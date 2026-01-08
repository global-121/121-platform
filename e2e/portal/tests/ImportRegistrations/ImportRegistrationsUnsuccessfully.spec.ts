import { test } from '@playwright/test';
import path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Unsuccessfully import registrations', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);
  const wrongRegistrationsDataFilePath = path.resolve(
    __dirname,
    '../../../test-registration-data/test-registrations-OCW-scoped.csv',
  );

  const programTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(programTitle);
  });

  await test.step('Import registrations to PV program successfully', async () => {
    await registrationsPage.importRegistrations(wrongRegistrationsDataFilePath);
    await registrationsPage.waitForImportProcessToComplete();
  });

  await test.step('Validate import error message', async () => {
    await registrationsPage.validateErrorMessage('Something went wrong');
  });
});
