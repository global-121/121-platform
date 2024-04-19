import { test, expect } from '@playwright/test';
import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { importRegistrationsCSV } from '@121-service/test/helpers/registration.helper';
import { getAccessToken, resetDB } from '@121-service/test/helpers/utility.helper';

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
  await loginPage.login(process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN, process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN);
});

test('[27411] Open PA profile page', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should display correct amount of runnig projects and open PAs for registration', async () => {
    await homePage.validateNumberOfActivePrograms(2);
    await homePage.openPAsForRegistrationOcwProgram('NLRC OCW program');
  });

  await test.step('Should validate first row with uploaded PAs', async () => {
    await table.verifyRowTableLeft(1, { personAffected: 'PA #1', firstName: undefined, lastName: undefined, phoneNumber: undefined, status: 'Registered' });
    await table.verifyRowTableRight(1, { preferredLanguage: 'English' });
    await table.clickOnPaNumber(1);
  });

  await test.step('Should validate PA profile opened succesfully', async () => {
    await registration.validatePaProfileOpened();
  });
});
