import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { test } from '@playwright/test';

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

test('Change Language', async ({ page }) => {
  const homePage = new HomePage(page);
  await page.waitForURL((url) => url.pathname.startsWith('/en/'));

  await homePage.changeLanguage('Nederlands');
  await page.waitForURL((url) => url.pathname.startsWith('/nl/'));

  await homePage.changeLanguage('English');
  await page.waitForURL((url) => url.pathname.startsWith('/en/'));
});
