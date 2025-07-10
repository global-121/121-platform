import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Change Language', async ({ page }) => {
  const homePage = new HomePage(page);
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/'));

  await homePage.changeLanguage('Nederlands');
  await page.waitForURL((url) => url.pathname.startsWith('/nl/'));

  await homePage.changeLanguage('English');
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/'));
});
