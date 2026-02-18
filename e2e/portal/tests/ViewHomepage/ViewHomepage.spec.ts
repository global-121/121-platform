import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import {
  customSharedFixture as test,
  expect,
} from '@121-e2e/portal/fixtures/fixture';

/**
 * This test is here to just load the homepage and check if it loads without any errors to make sure we don't break the infrastructure that runs the tests.
 */
test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
    navigateToPage: '/',
  });
});

test('Load Portal', async ({ page }) => {
  expect(await page.title()).toBe('121 Portal'); // This is the title in the downloaded HTML, not the rendered Angular-app page-title
});

test('View All programs', async ({ page }) => {
  // Assert
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/programs'));
  await expect(page.locator('h1')).toContainText('All programs');
  await expect(page.locator('a[href^="/en-GB/program/"]')).toHaveCount(2);
});
