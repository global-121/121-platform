import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';

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

test('Log Out via Menu', async ({ page }) => {
  const homePage = new HomePage(page);
  const loginPage = new LoginPage(page);

  await test.step('Should navigate to user account dropdown and select Log-out option', async () => {
    await homePage.selectAccountOption('Logout');

    await loginPage.loginButton.isVisible();
  });
});

test('Log Out via manual log-out URL', async ({ page }) => {
  await test.step('Should navigate to manual logout URL', async () => {
    await page.goto('/logout');

    // Actually logging-out takes at least 1 second...
    await page.waitForURL((url) => url.pathname.startsWith('/en-GB/login'));

    // Try to access a protected page
    await page.goto('/en-GB/users');

    await expect(page).not.toHaveURL(/.*\/en-GB\/users/);
    await expect(page).toHaveURL(/.*\/en-GB\/login/);
  });
});
