import { test, expect } from '@playwright/test';
import HomePage from '../../../pages/Home/HomePage';
import LoginPage from '../../../pages/Login/LoginPage';
import TableModule from '../../../pages/Table/TableModule';
import RegistrationDetails from '../../../pages/RegistrationDetails/RegistrationDetailsPage';
import { SeedScript } from '../../../../../src/scripts/seed-script.enum';
import { importRegistrationsCSV } from '../../../../API/helpers/registration.helper';
import { getAccessToken, resetDB } from '../../../../API/helpers/utility.helper';
import Helpers from '../../../pages/Helpers/helpers';

test.beforeEach(async ({ page }) => {
  // Reset the DB to the required state
  const response = await resetDB(SeedScript.nlrcMultiple);
  expect(response.status).toBe(202);
  // Upload registration from the file
  const programIdOcw = 3;
  const accessToken = await getAccessToken();
  await importRegistrationsCSV(
    programIdOcw,
    '../../test-registration-data/test-registrations-OCW.csv',
    accessToken,
  );
  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN, process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN);
});

test('[27492] View Personal information table', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);
  const helpers = new Helpers;

  await test.step('Should open PAs for registration', async () => {
    await homePage.openPAsForRegistrationOcwProgram('NLRC OCW program');
  });

  await test.step('Should open first uploaded PA', async () => {
    await table.clickOnPaNumber(1);
  });

  await test.step('Should validate PA profile includes Personal information with details', async () => {
    await registration.validatePaProfileOpened();
    // Reload the page to make asynchronous data available
    await page.reload();
    // Reload should be removed after fixing the issue with the data not being available https://dev.azure.com/redcrossnl/121%20Platform/_workitems/edit/27568
    await registration.validatePersonalInformationTable(
      "PA #1",
      "Registered",
      await helpers.getTodaysDate(),
      "English",
      "+14155238886",
      "Visa debit card"
    );
  });
});
