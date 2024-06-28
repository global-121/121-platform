import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { importRegistrationsCSV } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { test } from '@playwright/test';
import { BulkActionId } from '../../../../../121-platform/interfaces/Portal/src/app/models/bulk-actions.models';
import { AppRoutes } from '../../../../interfaces/Portal/src/app/app-routes.enum';
import HomePage from '../../../pages/Home/HomePage';
import LoginPage from '../../../pages/Login/LoginPage';
import TableModule from '../../../pages/Table/TableModule';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOcw = 3;

  const accessToken = await getAccessToken();
  await importRegistrationsCSV(
    programIdOcw,
    './test-registration-data/test-registrations-OCW.csv',
    accessToken,
  );
  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
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
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
    await table.quickFilter('succeed');
    await table.validateQuickFilterResultsNumber({ expectedNumber: 3 });
    await table.applyBulkAction(BulkActionId.sendMessage);
    await table.validateBulkActionTargetedPasNumber({
      expectedNumber: 3,
      bulkAction: BulkActionId.sendMessage,
    });
  });
});
