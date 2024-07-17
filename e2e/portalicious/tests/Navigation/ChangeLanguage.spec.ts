import HomePage from '@121-e2e/portalicious/pages/HomePage';
import { test } from '@playwright/test';

test('Change Language', async ({ page }) => {
  await page.goto('/en/');

  const homePage = new HomePage(page);
  await page.waitForURL((url) => url.pathname.startsWith('/en/'));

  await homePage.changeLanguage('Dutch');
  await page.waitForURL((url) => url.pathname.startsWith('/nl/'));

  await homePage.changeLanguage('Engels');
  await page.waitForURL((url) => url.pathname.startsWith('/en/'));
});
