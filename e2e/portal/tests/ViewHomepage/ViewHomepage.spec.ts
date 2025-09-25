import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';

/**
 * This test is here to just load the homepage and check if it loads without any errors to make sure we don't break the infrastructure that runs the tests.
 */
test('Load Portal', async ({ page }) => {
  await page.goto('/');
  expect(await page.title()).toBe('121 Portal'); // This is the title in the downloaded HTML, not the rendered Angular-app page-title
});

test('View All projects', async ({ page }) => {
  // Arrange
  await resetDB(SeedScript.testMultiple, __filename);
  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();

  // Act
  await page.goto('/');

  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/projects'));

  // Assert
  await expect(page.locator('h1')).toContainText('All projects');
  await expect(page.locator('a[href^="/en-GB/project/"]')).toHaveCount(2);
});
