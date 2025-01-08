import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portalicious/pages/BasePage';
import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import UsersPage from '@121-e2e/portalicious/pages/UsersPage';

const date = new Date();
const formattedDate = format(date, 'dd/MM/y,');
const formattedTime = format(date, 'HH:mm');
const loginTimeStamp = `${formattedDate} ${formattedTime}`;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.oneAdmin);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_USER_VIEW,
  );
});

test('[30866] [Admin] View last login', async ({ page }) => {
  const basePage = new BasePage(page);
  const loginPage = new LoginPage(page);
  const home = new HomePage(page);
  const users = new UsersPage(page);

  await test.step('Log out and Login with Admin user', async () => {
    // Log out
    await home.selectAccountOption('Logout');
    // Login
    await loginPage.login(
      process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
      process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
    );
  });

  await test.step('Validate last login', async () => {
    await basePage.navigateToPage('Users');
    // Assert
    await users.validateRowTextContent({
      email: process.env.USERCONFIG_121_SERVICE_EMAIL_USER_VIEW!,
      textContent: loginTimeStamp,
    });
  });
});
