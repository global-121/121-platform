import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.test);

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
  await page.waitForURL((url) => url.pathname.startsWith('/en/users'));

  await homePage.navigateToPage('Roles and permissions');
  await page.waitForURL((url) =>
    url.pathname.startsWith('/en/roles-and-permissions'),
  );
});

test('Navigation from program header', async ({ page }) => {
  const homePage = new HomePage(page);

  const projectTitle = 'Cash program Westeros';

  await page.goto('/en/projects');
  await page.getByRole('link', { name: projectTitle }).click();
  await page.waitForURL((url) =>
    url.pathname.startsWith('/en/project/1/registrations'),
  );
  await expect(await homePage.logo).toHaveText(`121 Portal${projectTitle}`);

  await homePage.navigateToProgramPage('Monitoring');
  await page.waitForURL((url) =>
    url.pathname.startsWith('/en/project/1/monitoring'),
  );
});
