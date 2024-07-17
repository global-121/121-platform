import HomePage from '@121-e2e/portalicious/pages/HomePage';
import { test } from '@playwright/test';

test('Navigation from sidebar', async ({ page }) => {
  await page.goto('/en/');

  const homePage = new HomePage(page);
  await homePage.navigateToPage('Users');
  await page.waitForURL((url) => url.pathname.startsWith('/en/users'));

  await homePage.navigateToPage('Roles and permissions');
  await page.waitForURL((url) =>
    url.pathname.startsWith('/en/roles-and-permissions'),
  );
});

test('Navigation from program header', async ({ page }) => {
  const homePage = new HomePage(page);

  await page.goto('/en/all-projects');
  await page.getByRole('link', { name: 'Go to NLRC program' }).click();
  await page.waitForURL((url) =>
    url.pathname.startsWith('/en/program/1/registrations'),
  );

  await homePage.navigateToProgramPage('Overview');
  await page.waitForURL((url) =>
    url.pathname.startsWith('/en/program/1/overview'),
  );
});
