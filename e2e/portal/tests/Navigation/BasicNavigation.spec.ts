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

const projectId = 2;
const projectTitle = 'NLRC Direct Digital Aid Program (PV)';
// Arrange
const reset = async () => {
  const accessToken = await getAccessToken();

  await resetDB(SeedScript.nlrcMultiple, __filename);
  await seedIncludedRegistrations(registrationsPV, projectId, accessToken);
};

const login = async (page: Page, email?: string, password?: string) => {
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(email, password);
  // Navigate to program
  await loginPage.selectProgram(projectTitle);
};

test.describe('Validate basic navigation of the Portal', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await reset();
    page = await browser.newPage();
    await login(
      page,
      process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    );
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

    await page.goto('/en-GB/projects');
    await page.getByRole('link', { name: projectTitle }).click();
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${projectId}/registrations`),
    );
    await expect(await homePage.logo).toHaveText(`121 Portal ${projectTitle}`);

    await homePage.navigateToProgramPage('Monitoring');
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${projectId}/monitoring`),
    );
  });

  test('Reload registrations page', async () => {
    const registrationsPage = new RegistrationsPage(page);

    await page.goto('/en-GB/projects');
    await page.getByRole('link', { name: projectTitle }).click();
    await registrationsPage.waitForLoaded(registrationsPV.length);
  });
});
