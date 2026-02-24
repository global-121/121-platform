import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
    skipSeedRegistrations: true,
  });
});

test('Change Language', async ({ page, homePage }) => {
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/'));

  await homePage.changeLanguage('Nederlands');
  await page.waitForURL((url) => url.pathname.startsWith('/nl/'));

  await homePage.changeLanguage('English');
  await page.waitForURL((url) => url.pathname.startsWith('/en-GB/'));
});
