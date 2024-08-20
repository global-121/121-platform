import CreateProject from '@121-e2e/portalicious/pages/CreateProjectPage';
import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { test } from '@playwright/test';

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

test('[29635] Create project successfully', async ({ page }) => {
  const homePage = new HomePage(page);
  const createProject = new CreateProject(page);

  await test.step('Should navigate to main page and select "Create new project" button and fill in the form', async () => {
    await homePage.openCreateNewProject();
    await createProject.fillInForm({
      assetId: process.env.E2E_TEST_KOBO_ASSET_ID,
      token: process.env.E2E_TEST_KOBO_TOKEN,
    });
    await createProject.submitForm();
    await createProject.assertCreateProjectSuccessPopUp();
    await page.waitForURL((url) =>
      url.pathname.startsWith('/en/project/2/registrations'),
    );
  });
});
