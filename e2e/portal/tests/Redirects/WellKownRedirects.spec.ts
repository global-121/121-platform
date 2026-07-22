import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test('Change password redirect', async ({
  loginPage,
  page,
  changePasswordPage,
}) => {
  // Arrange
  await resetDB({
    seedScript: SeedScript.testMultiple,
  });
  await loginPage.loginAsAdmin();

  await test.step('Should bring the user to the Change-Password-page from a well-known URL', async () => {
    await page.goto('/.well-known/change-password');

    await changePasswordPage.changePasswordButton.isVisible();
  });

  await test.step('Should bring the user to the Change-Password-page from an easily memorable URL', async () => {
    await page.goto('/change-password');

    await changePasswordPage.changePasswordButton.isVisible();
  });
});

test('Login redirect', async ({ page, loginPage }) => {
  await test.step('Should bring the user to the Login-page from a well-known URL', async () => {
    await page.goto('/.well-known/login');

    await loginPage.loginButton.isVisible();
  });

  await test.step('Should bring the user to the Login-page from an easily memorable URL', async () => {
    await page.goto('/login');

    await loginPage.loginButton.isVisible();
  });
});
