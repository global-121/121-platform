import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';
import RegistrationsPage from '@121-e2e/portal/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Validate that "Duplicate" banner is displayed in overview of duplicated registrations', async ({
  page,
}) => {
  const homePage = new HomePage(page);
  const registrations = new RegistrationsPage(page);
  const registrationActivityLogPage = new RegistrationActivityLogPage(page);

  const programTitle = 'NLRC Direct Digital Aid Program (PV)';

  const duplicateRegistrationA = registrationsPV[1]; // 'Jan Janssen'
  const duplicateRegistrationB = registrationsPV[2]; // 'Joost Herlembach'
  const uniqueRegistration = registrationsPV[0]; // 'Gemma Houtenbos'

  await test.step('Select program', async () => {
    await homePage.selectProgram(programTitle);
  });

  await test.step('Wait for registrations to load', async () => {
    const allRegistrationsCount = registrationsPV.length;
    await registrations.waitForLoaded(allRegistrationsCount);
  });

  await test.step('Open registration page', async () => {
    await registrations.goToRegistrationByName({
      registrationName: duplicateRegistrationA.fullName,
    });
  });

  await test.step('View banner with duplicate', async () => {
    await registrationActivityLogPage.assertDuplicateWith({
      duplicateName: duplicateRegistrationB.fullName,
    });
  });

  await test.step('Verify link to duplicate works', async () => {
    const duplicateBLink =
      registrationActivityLogPage.duplicatesBanner.getByRole('link', {
        name: duplicateRegistrationB.fullName,
      });

    await expect(duplicateBLink).toBeVisible();
    await duplicateBLink.click();
  });

  await test.step('Verify new tab is opened and contains link to orignial duplicate', async () => {
    await page.waitForTimeout(2000); //waitForNavigation and waitForLoadState do not work in this case

    const pages = await page.context().pages();

    await expect(pages).toHaveLength(2);

    const registrationActivityLogPageForDuplicateB =
      new RegistrationActivityLogPage(pages[1]);

    await registrationActivityLogPageForDuplicateB.assertDuplicateWith({
      duplicateName: duplicateRegistrationA.fullName,
    });
  });

  await test.step('Navigate back to registrations table', async () => {
    await page.bringToFront();
    await page.goBack();
  });

  await test.step('Open registration page for unique registration', async () => {
    await registrations.goToRegistrationByName({
      registrationName: uniqueRegistration.fullName,
    });
  });

  await test.step('Verify no banner is displayed for unique registration', async () => {
    await expect(
      registrationActivityLogPage.duplicatesBanner,
    ).not.toBeVisible();

    await registrationActivityLogPage.assertDuplicateStatus({
      status: 'Unique',
    });
  });
});
