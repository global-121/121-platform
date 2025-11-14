import { expect, type Page, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

const programId = 2;
const programTitle = 'NLRC Direct Digital Aid Program (PV)';

// Arrange
test.describe('Validate basic navigation of the Portal', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    const accessToken = await getAccessToken();
    await seedIncludedRegistrations(registrationsPV, programId, accessToken);

    page = await browser.newPage();

    const loginPage = new LoginPage(page);
    await page.goto(`/`);
    await loginPage.login();
    // Navigate to program
    await loginPage.selectProgram(programTitle);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Navigation from sidebar', async () => {
    const homePage = new HomePage(page);

    await page.goto('/');
    await homePage.navigateToPage('Users');
    await page.waitForURL((url) => url.pathname.startsWith('/en-GB/users'));

    await homePage.navigateToPage('User roles');
    await page.waitForURL((url) =>
      url.pathname.startsWith('/en-GB/user-roles'),
    );
  });

  test('Navigation from program header', async () => {
    const homePage = new HomePage(page);

    await page.goto('/en-GB/programs');
    await page.getByRole('link', { name: programTitle }).click();
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programId}/registrations`),
    );
    await expect(await homePage.logo).toHaveText(`121 Portal ${programTitle}`);

    await homePage.navigateToProgramPage('Monitoring');
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programId}/monitoring`),
    );
  });

  test('Reload registrations page', async () => {
    const registrationsPage = new RegistrationsPage(page);

    await page.goto('/en-GB/programs');
    await page.getByRole('link', { name: programTitle }).click();
    await registrationsPage.waitForLoaded(registrationsPV.length);
  });
});
