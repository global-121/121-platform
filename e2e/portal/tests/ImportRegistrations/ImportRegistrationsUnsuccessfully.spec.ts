import { test } from '@playwright/test';
import path from 'path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProjectPV from '@121-service/src/seed-data/project/project-nlrc-pv.json';
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

test('[29369] Unsuccessfully import registrations', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);
  const wrongRegistrationsDataFilePath = path.resolve(
    __dirname,
    '../../../test-registration-data/test-registrations-OCW-scoped.csv',
  );

  const projectTitle = NLRCProjectPV.titlePortal.en;

  await test.step('Select project', async () => {
    await registrationsPage.selectProject(projectTitle);
  });

  await test.step('Import registrations to PV project successfully', async () => {
    await registrationsPage.importRegistrations(wrongRegistrationsDataFilePath);
    await registrationsPage.waitForImportProcessToComplete();
  });

  await test.step('Validate import error message', async () => {
    await registrationsPage.validateErrorMessage(
      'Something went wrong with this import. Please fix the errors reported below and try again.',
    );
  });
});
