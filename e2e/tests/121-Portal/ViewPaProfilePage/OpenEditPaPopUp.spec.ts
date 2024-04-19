import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { importRegistrationsCSV } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { expect, test } from '@playwright/test';
import HomePage from '../../../pages/Home/HomePage';
import LoginPage from '../../../pages/Login/LoginPage';
import RegistrationDetails from '../../../pages/RegistrationDetails/RegistrationDetailsPage';
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

test('[27493] Open the edit PA popup', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should open PAs for registration', async () => {
    await homePage.openPAsForRegistrationOcwProgram('NLRC OCW program');
  });

  await test.step('Should open first uploaded PA', async () => {
    await table.clickOnPaNumber(1);
  });

  await test.step('Should open PA profile and open edit pop-up', async () => {
    await registration.validatePaProfileOpened();
    await registration.openEditPaPopUp();
    await registration.validateEditPaPopUpOpened();
  });
});
