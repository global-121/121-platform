import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

// This test is here to just load the homepage
// and check if it loads without any errors.
// Later we can port the existing tests to check the functionality
// but for now, this is just a placeholder to make sure
// we don't break the infrastructure that runs the tests.
test('Load Homepage', async ({ page }) => {
  await page.goto('/');
  expect(await page.title()).toBe('121 Portal');
});
