import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import ChangePasswordPage from '@121-e2e/portal/pages/ChangePasswordPage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';

test('Change password redirect', async ({ page }) => {
  // Arrange
  await resetDB({
    seedScript: SeedScript.testMultiple,
  });
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();

  const changePasswordPage = new ChangePasswordPage(page);

  await test.step('Should bring the user to the Change-Password-page from a well-known URL', async () => {
    await page.goto('/.well-known/change-password');

    await changePasswordPage.changePasswordButton.isVisible();
  });

  await test.step('Should bring the user to the Change-Password-page from an easily memorable URL', async () => {
    await page.goto('/change-password');

    await changePasswordPage.changePasswordButton.isVisible();
  });
});

test('Login redirect', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await test.step('Should bring the user to the Login-page from a well-known URL', async () => {
    await page.goto('/.well-known/login');

    await loginPage.loginButton.isVisible();
  });

  await test.step('Should bring the user to the Login-page from an easily memorable URL', async () => {
    await page.goto('/login');

    await loginPage.loginButton.isVisible();
  });
});
