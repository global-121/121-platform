import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';

test.beforeEach(async () => {
  await resetDB({
    seedScript: SeedScript.testMultiple,
  });
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

  // Verify the session expired toast is shown on the login page
  const sessionExpiredToast = page.locator('.p-toast-message');
  await expect(sessionExpiredToast).toBeVisible();
  await expect(sessionExpiredToast).toContainText('Session expired');
});

test('User is silently redirected to login on fresh page load with already-expired token (no popup)', async ({
  page,
}) => {
  // Inject an already-expired token into localStorage before the Angular app initializes.
  // This simulates opening the app fresh the next day with a stale token.
  // The script is passed as a string so it executes in the browser context, not in Node.js.
  const expiredUser = JSON.stringify({
    username: 'test@example.org',
    isAdmin: true,
    isEntraUser: false,
    isOrganizationAdmin: false,
    permissions: {},
    // Expired 24 hours ago
    expires: new Date(Date.now() - 24 * 60 * 60 * 1_000).toISOString(),
  });
  await page.addInitScript(
    `localStorage.setItem('logged-in-user-portalicious', ${JSON.stringify(expiredUser)});`,
  );

  await page.goto('/');

  // Should be silently redirected to the login page
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/login'));
  await expect(page).toHaveURL(/.*\/en-GB\/login/);

  // The "Session expired" dialog must NOT appear — this was Scenario B (fresh open)
  const sessionExpiredDialog = page.getByText('Session expired');
  await expect(sessionExpiredDialog).not.toBeVisible();
});
