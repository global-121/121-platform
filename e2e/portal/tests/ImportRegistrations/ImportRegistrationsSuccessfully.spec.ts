import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[29368] Successfully import registrations - INTENTIONAL FAILURE', async ({
  page,
}) => {
  console.log('page: ', page);
  // INTENTIONAL FAILURE: This assertion will always fail to test the aggregation system
  expect(false).toBe(true); // This will fail and demonstrate e2e test failure reporting

  // await test.step('Import registrations to PV program successfully', async () => {
  //   await registrationsPage.importRegistrations(registrationsDataFilePath);
  //   await registrationsPage.validateToastMessageAndClose(
  //     'Registration(s) imported successfully',
  //   );
  // });

  // await test.step('Validate registrations are present in the table and the counts match', async () => {
  //   // Default display filter number
  //   await table.validateWaitForTableRowCount({ expectedRowCount: 10 });
  //   // Uploaded records count
  //   await table.validateAllRecordsCount(20);
  // });
});
