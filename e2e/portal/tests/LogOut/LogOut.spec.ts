import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true, // Skip seeding registrations for logout tests
  });
});

test('Log Out via Menu', async ({ homePage, loginPage }) => {
  await test.step('Should navigate to user account dropdown and select Log-out option', async () => {
    await homePage.selectAccountOption('Logout');
    await loginPage.loginButton.isVisible();
  });
});

test('Log Out via manual log-out URL', async ({ page }) => {
  await test.step('Should navigate to manual logout URL', async () => {
    await page.goto('/logout');

    // Actually logging-out takes at least 1 second...
    await page.waitForURL((url) => url.pathname.startsWith('/en-GB/login'));

    // Try to access a protected page
    await page.goto('/en-GB/users');

    await expect(page).not.toHaveURL(/.*\/en-GB\/users/);
    await expect(page).toHaveURL(/.*\/en-GB\/login/);
  });
});
