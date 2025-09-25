import { test } from '@playwright/test';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import CreateProject from '@121-e2e/portal/pages/CreateProjectPage';
import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';

test('[29635] Create project successfully', async ({ page }) => {
  test.skip(
    !env.KOBO_CONNECT_API_URL ||
      // eslint-disable-next-line n/no-process-env -- This environment variable `E2E_TEST_KOBO_ASSET_ID` is NOT used in the 121-service, thus not managed via the env.ts file.
      !process.env.E2E_TEST_KOBO_ASSET_ID ||
      // eslint-disable-next-line n/no-process-env -- This environment variable `E2E_TEST_KOBO_TOKEN` is NOT used in the 121-service, thus not managed via the env.ts file.
      !process.env.E2E_TEST_KOBO_TOKEN,
    'Disable use of third-party API by default. Can be used by explicitly providing all ENV-values. See AB#30220',
  );

  // Arrange
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();

  // The above test-preparation (resetDB + login) is done AFTER the skip-check, to prevent unnecessary time-consuming operations in CI.

  const homePage = new HomePage(page);
  const createProject = new CreateProject(page);

  // Act
  await test.step('Should navigate to main page and select "Create new project" button and fill in the form', async () => {
    await homePage.openCreateNewProject();
    await createProject.fillInForm({
      // eslint-disable-next-line n/no-process-env -- This environment variable `E2E_TEST_KOBO_ASSET_ID` is NOT used in the 121-service, thus not managed via the env.ts file.
      assetId: process.env.E2E_TEST_KOBO_ASSET_ID,
      // eslint-disable-next-line n/no-process-env -- This environment variable `E2E_TEST_KOBO_TOKEN` is NOT used in the 121-service, thus not managed via the env.ts file.
      token: process.env.E2E_TEST_KOBO_TOKEN,
    });
    await createProject.submitForm();

    // Assert
    await createProject.assertCreateProjectSuccessPopUp();
    await page.waitForURL((url) =>
      url.pathname.startsWith('/en-GB/project/2/registrations'),
    );
  });
});
