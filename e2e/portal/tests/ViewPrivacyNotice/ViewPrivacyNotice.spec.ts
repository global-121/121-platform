import { expect, test } from '@playwright/test';

import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.describe('View Privacy Notice', () => {
  test('when logged-out', async ({ page }) => {
    // Arrange
    await page.goto('/logout'); // Make sure we're not logged in

    // Act
    await page.goto('/en-GB/privacy');

    // Assert
    await expect(page.locator('h1')).toContainText('Privacy');
  });

  test('when logged-in', async ({ page }) => {
    // Arrange
    const loginPage = new LoginPage(page);
    await page.goto(`/`);
    await loginPage.login();

    // Act
    await page.goto('/en-GB/privacy');

    // Assert
    await expect(page.locator('h1')).toContainText('Privacy');
  });
});
