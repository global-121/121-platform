import { expect, test } from '@playwright/test';
import LoginPage from '../../../pages/Login/LoginPage';
import HomePage from '../../../pages/Home/HomePage';
import { resetDB } from '../../../helpers/utility.helper';
import { SeedScript } from '../../../../../../src/scripts/seed-script.enum';

test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);

  // Intercept resetDB request
  await page.route('**/scripts/reset*', (route) => {
    route.continue();
  });

  // Call resetDB and await the response
  const response = await resetDB(SeedScript.test);

  // You can access response data and status here
  console.log(response.status);
  console.log(response.data);

  expect(response.status).toBe(202);

  await page.goto('/login');
  await loginPage.login('admin@example.org', 'password');
});

test('should display correct amount of runnig projects', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.validateNumberOfActivePrograms(1);
});
