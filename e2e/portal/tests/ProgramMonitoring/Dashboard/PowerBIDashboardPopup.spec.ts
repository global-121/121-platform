import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

// Add type declaration to ensure it is read-only and unknown (it will be used in a browser-context by Playwright)
declare const window: { readonly opener: unknown };

test.beforeEach(async ({ baseURL, page, resetDBAndSeedRegistrations }) => {
  const programUrl = new URL(`/en-GB/program/${programIdOCW}/`, baseURL);

  await page.route('https://app.powerbi.com/**', async (route) => {
    await route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html>
        <html>
          <body>
            <a href="${programUrl}" target="_blank" rel="noopener">Open Portal</a>
          </body>
        </html>`,
    });
  });

  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    navigateToPage: `/program/${programIdOCW}/monitoring/powerbi`,
  });
});

test('PowerBI-dashboard(s) can open the Portal without retaining an opener reference', async ({
  page,
}) => {
  await test.step('Verify the Portal sends the expected COOP header', async () => {
    const response = await page.request.get(page.url());

    expect(response.headers()['cross-origin-opener-policy']).toBe(
      'same-origin',
    );
  });

  await test.step('Open the Portal from the PowerBI-iframe', async () => {
    const popupPromise = page.context().waitForEvent('page');

    await page
      .frameLocator('[data-testid="monitoring-iframe"] iframe')
      .getByRole('link', { name: 'Open Portal' })
      .click();

    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');

    await expect(popup).toHaveURL(
      `/en-GB/program/${programIdOCW}/registrations`,
    );
    await expect(
      popup.getByRole('heading', { name: 'Registrations', exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => popup.evaluate(() => window.opener === null))
      .toBe(true);
  });
});
