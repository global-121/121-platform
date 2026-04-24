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
  await loginPage.loginAsAdmin();

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
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();

  // Verify we're logged in
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/programs'));

  // Simulate time passing while the browser was closed: backdate the stored
  // token's `expires` field so it looks stale when the app next boots.
  const localStorageKey = 'logged-in-user-portalicious';
  /* eslint-disable n/no-unsupported-features/node-builtins -- page.evaluate runs in the browser, not Node */
  await page.evaluate((key) => {
    const expiredTimeStamp = `1970-01-01T00:00:00.000Z`;

    const user = JSON.parse(localStorage.getItem(key)!);
    user.expires = expiredTimeStamp;
    localStorage.setItem(key, JSON.stringify(user));
  }, localStorageKey);
  /* eslint-enable n/no-unsupported-features/node-builtins -- re-enable after browser-context block */

  // Full page reload simulates reopening the browser to a bookmarked page.
  // sessionWasActive resets to false (in-memory only), but the expired token
  // is still in localStorage.
  await page.goto('/en-GB/program/2/registrations');

  // The "Session expired" dialog must NOT appear
  const sessionExpiredDialog = page.getByText('Session expired');
  await expect(sessionExpiredDialog).not.toBeVisible();
  // After logging back in, the user should land on the originally requested URL.
  await loginPage.loginAsAdmin();
  await page.waitForURL((url) =>
    url.pathname.endsWith('/program/2/registrations'),
  );
});

test('User with a valid (non-expired) token is not redirected to login on page reload', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();

  // Verify we're logged in
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/programs'));

  // Reload the page to simulate returning to the app with a still-valid token
  await page.reload();

  // Should remain on the programs page, not redirected to login
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/programs'));
  await expect(page).toHaveURL(/.*\/en-GB\/programs/);

  // The "Session expired" dialog must NOT appear
  const sessionExpiredDialog = page.getByText('Session expired');
  await expect(sessionExpiredDialog).not.toBeVisible();
});
