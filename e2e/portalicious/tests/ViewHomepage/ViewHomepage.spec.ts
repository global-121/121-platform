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

// This test is here to just load the homepage
// and check if it loads without any errors.
// Later we can port the existing tests to check the functionality
// but for now, this is just a placeholder to make sure
// we don't break the infrastructure that runs the tests.
test('Load Homepage', async ({ page }) => {
  await page.goto('/');
  expect(await page.title()).toBe('121 Portal(icious)');
});
