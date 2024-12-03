import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

const projectId = 2;
const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, projectId, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('Navigation from sidebar', async ({ page }) => {
  await page.goto('/');

  const homePage = new HomePage(page);
  await homePage.navigateToPage('Users');
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/users'));

  await homePage.navigateToPage('User roles');
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/user-roles'));
});

test('Navigation from program header', async ({ page }) => {
  const homePage = new HomePage(page);

  await page.goto('/en-GB/projects');
  await page.getByRole('link', { name: projectTitle }).click();
  await page.waitForURL((url) =>
    url.pathname.startsWith(`/en-GB/project/${projectId}/registrations`),
  );
  await expect(await homePage.logo).toHaveText(`121 Portal${projectTitle}`);

  await homePage.navigateToProgramPage('Monitoring');
  await page.waitForURL((url) =>
    url.pathname.startsWith(`/en-GB/project/${projectId}/monitoring`),
  );
});

test('Reload registrations page', async ({ page }) => {
  const registrationsPage = new RegistrationsPage(page);

  await page.goto('/en-GB/projects');
  await page.getByRole('link', { name: projectTitle }).click();
  await registrationsPage.waitForLoaded(registrationsPV.length);

  await page.reload();
  await registrationsPage.waitForLoaded(registrationsPV.length);
});
