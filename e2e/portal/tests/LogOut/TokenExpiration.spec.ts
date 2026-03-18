import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.beforeEach(async () => {
  await resetDB(SeedScript.testMultiple, __filename);
});

test('User is redirected to login when token expires', async ({ page }) => {
  await page.route('**/api/users/login', async (route) => {
    const response = await route.fetch();
    const body = await response.json();

    const expiresIn1Second = new Date(Date.now() + 1_000).toISOString();
    body.expires = expiresIn1Second;

    await route.fulfill({
      response,
      json: body,
    });
  });

  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();

  // Verify we're logged in
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/programs'));

  // Wait for the session expired dialog to appear
  const dialog = page.getByText('Session expired');
  await expect(dialog).toBeVisible({ timeout: 5_000 });

  // Click the "Go to login page" button
  await page.getByTestId('session-expired-go-to-login-button').click();

  // Verify redirect to login page
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/login'));
  await expect(page).toHaveURL(/.*\/en-GB\/login/);
});
