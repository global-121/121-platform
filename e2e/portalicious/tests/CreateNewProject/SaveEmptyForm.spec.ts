import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import CreateProject from '@121-e2e/portalicious/pages/CreateProjectPage';
import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.test);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[29637] Save with empty form', async ({ page }) => {
  const homePage = new HomePage(page);
  const createProject = new CreateProject(page);

  await test.step('Should navigate to main page and select "Create new project" button', async () => {
    await homePage.openCreateNewProject();
    await createProject.submitForm();
    await createProject.validateMultipleFormErrors({
      errorText: 'This field is required.',
    });
  });
});
