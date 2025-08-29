import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  projectIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, projectIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

const chosenRegistration = registrationsPV[registrationsPV.length - 1];

test('Open registration in new tab and verify new tab', async ({ page }) => {
  const basePage = new BasePage(page);
  const registrations = new RegistrationsPage(page);

  const projectTitle = 'NLRC Direct Digital Aid Project (PV)';

  await test.step('Select project', async () => {
    await basePage.selectProject(projectTitle);
  });

  await test.step('Open registration in new tab', async () => {
    // Count all registrations
    const allRegistrationsCount = registrationsPV.length;

    // Wait for page to load
    await registrations.waitForLoaded(allRegistrationsCount);

    // Get the first registration's full name from the table
    const registrationName = chosenRegistration.fullName;

    await registrations.performActionOnRegistrationByName({
      registrationName,
      action: 'Open in new tab',
    });
  });

  await test.step('Verify new tab is opened', async () => {
    await page.waitForTimeout(2000); //waitForNavigation and waitForLoadState do not work in this case

    const pages = page.context().pages();

    expect(pages).toHaveLength(2);

    expect(await pages[1].title()).toEqual(
      'Activity log | Registration details | 121 Portal',
    );

    const pageHeader = await pages[1].$('h1');

    expect(await pageHeader?.textContent()).toContain(
      chosenRegistration.fullName,
    );
  });
});
