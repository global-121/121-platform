import { test } from '@playwright/test';
import path from 'path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[29368] Successfully import registrations - INTENTIONAL FAILURE', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);
  const table = new TableComponent(page);
  const registrationsDataFilePath = path.resolve(
    __dirname,
    '../../../test-registration-data/test-registrations-PV.csv',
  );

  const projectTitle = NLRCProgramPV.titlePortal.en;

  // INTENTIONAL FAILURE: This assertion will always fail to test the aggregation system
  expect(false).toBe(true); // This will fail and demonstrate e2e test failure reporting

  await test.step('Select program', async () => {
    await registrationsPage.selectProgram(projectTitle);
  });

  await test.step('Import registrations to PV program successfully', async () => {
    await registrationsPage.importRegistrations(registrationsDataFilePath);
    await registrationsPage.validateToastMessageAndClose(
      'Registration(s) imported successfully',
    );
  });

  await test.step('Validate registrations are present in the table and the counts match', async () => {
    // Default display filter number
    await table.validateWaitForTableRowCount({ expectedRowCount: 10 });
    // Uploaded records count
    await table.validateAllRecordsCount(20);
  });
});
