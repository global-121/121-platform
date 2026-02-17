import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import {
  customSharedFixture as test,
  expect,
} from '@121-e2e/portal/fixtures/fixture';

const programTitle = 'NLRC Direct Digital Aid Program (PV)';

// Arrange
test.describe('Validate basic navigation of the Portal', () => {
  test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      registrations: registrationsPV,
      programId: programIdPV,
      navigateToPage: `/program/${programIdPV}/registrations`,
    });
  });

  test('Navigation from sidebar', async ({ page, homePage }) => {
    await homePage.goto('/');
    await homePage.navigateToPage('Users');
    await page.waitForURL((url) => url.pathname.startsWith('/en-GB/users'));

    await homePage.navigateToPage('User roles');
    await page.waitForURL((url) =>
      url.pathname.startsWith('/en-GB/user-roles'),
    );
  });

  test('Navigation from program header', async ({ page, homePage }) => {
    await homePage.goto('/programs');
    await page.getByRole('link', { name: programTitle }).click();
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdPV}/registrations`),
    );
    await expect(homePage.logo).toHaveText(`121 Portal ${programTitle}`);

    await homePage.navigateToProgramPage('Monitoring');
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${programIdPV}/monitoring`),
    );
  });

  test('Reload registrations page', async ({ page, registrationsPage }) => {
    await registrationsPage.goto('/programs');
    await page.getByRole('link', { name: programTitle }).click();
    await registrationsPage.waitForLoaded(registrationsPV.length);
  });
});
