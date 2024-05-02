import NLRCProgram from '@121-service/seed-data/program/program-nlrc-ocw.json';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { importRegistrationsCSV } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { expect, test } from '@playwright/test';
import { BulkActionId } from '../../../../../121-platform/interfaces/Portal/src/app/models/bulk-actions.models';
import HomePage from '../../../pages/Home/HomePage';
import LoginPage from '../../../pages/Login/LoginPage';
import TableModule from '../../../pages/Table/TableModule';

test.beforeEach(async ({ page }) => {
  // Reset the DB to the required state
  const response = await resetDB(SeedScript.nlrcMultiple);
  expect(response.status).toBe(202);
  // Upload registration from the file
  const programIdOcw = 3;
  const accessToken = await getAccessToken();
  await importRegistrationsCSV(
    programIdOcw,
    './fixtures/test-registrations-OCW.csv',
    accessToken,
  );
  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[27614] Quick filter through available PAs and apply bulk action', async ({
  page,
}) => {
  const table = new TableModule(page);
  const homePage = new HomePage(page);

  await test.step('Should open popup to send message to correct amount of filtered PAs', async () => {
    await homePage.openPAsForRegistrationOcwProgram(NLRCProgram.titlePaApp.en);
    await table.quickFilter('succeed');
    // Really bad solution to tackle flickering issue of FE
    await page.waitForTimeout(5000);
    // Should be removed once FE is refactored/ changed/ perormance gets better WAITS LIKE THAT SHOULD BE AVOIDED
    await table.validateQuickFilterResultsNumber(3);
    await table.applyBulkAction(BulkActionId.sendMessage);
    await table.validateBulkActionTargetedPasNumber(3);
  });
});
