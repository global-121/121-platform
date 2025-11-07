import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import UsersPage from '@121-e2e/portal/pages/UsersPage';

const expectedUserEmails = [
  'admin@example.org',
  'program-admin@example.org',
  'view-user@example.org',
  'kobo+registration_country@example.org',
  'kobo+validation_country@example.org',
  'cva-manager@example.org',
  'cva-officer@example.org',
  'finance-manager@example.org',
  'finance-officer@example.org',
  'view-no-pii@example.org',
];

const expectedAssignedUsers = [
  'admin',
  'cva-manager',
  'cva-officer',
  'finance-manager',
  'finance-officer',
  'kobo+registration_country',
  'kobo+validation_country',
  'program-admin',
  'view-no-pii',
  'view-user',
];

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[Admin] View "Names" and "E-mails" on "Users" page', async ({ page }) => {
  const basePage = new BasePage(page);
  const users = new UsersPage(page);

  await test.step('Navigate to Users page', async () => {
    await basePage.navigateToPage('Users');
  });

  await test.step('Validate Users table elements', async () => {
    await users.validateAssignedUsersNames(expectedAssignedUsers);
    await users.validateAssignedUserEmails(expectedUserEmails);
  });
});
