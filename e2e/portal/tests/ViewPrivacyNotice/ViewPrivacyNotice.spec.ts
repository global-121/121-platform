import {
  customSharedFixture as test,
  expect,
} from '@121-e2e/portal/fixtures/fixture';

test.describe('View Privacy Notice', () => {
  test('when logged-out', async ({ page }) => {
    // Arrange
    await page.goto('/logout'); // Make sure we're not logged in
    // Act
    await page.goto('/en-GB/privacy');

    // Assert
    await expect(page.locator('h1')).toContainText('Privacy');
  });

  test('when logged-in', async ({ page, loginPage }) => {
    // Arrange
    await page.goto(`/`);
    await loginPage.login();
    // Act
    await page.goto('/en-GB/privacy');
    // Assert
    await expect(page.locator('h1')).toContainText('Privacy');
  });
});
