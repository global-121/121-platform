import { expect, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationsPV } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/portalicious/pages/HomePage';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portalicious/pages/RegistrationActivityLogPage';
import RegistrationsPage from '@121-e2e/portalicious/pages/RegistrationsPage';

test.beforeEach(async ({ page }) => {
  const programIdPV = 2;
  await resetDB(SeedScript.nlrcMultiple);

  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsPV, programIdPV, accessToken);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[] Ignore duplicates', async ({ page }) => {
  const homePage = new HomePage(page);
  const registrations = new RegistrationsPage(page);
  const registrationActivityLogPage = new RegistrationActivityLogPage(page);

  const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

  const duplicateRegistrationA = registrationsPV[1]; // 'Jan Janssen'
  const duplicateRegistrationB = registrationsPV[2]; // 'Joost Herlembach'
  // const uniqueRegistration = registrationsPV[0]; // 'Gemma Houtenbos'

  await test.step('Select program', async () => {
    await homePage.selectProgram(projectTitle);
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

  await test.step('Ignore duplication', async () => {
    await registrationActivityLogPage.inititateAction('Ignore duplication');

    const dialog = await registrationActivityLogPage.dialog;

    // await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Ignore duplication')).toBeVisible();

    const editInformationReasonField = await dialog.getByLabel('Add a reason');
    await editInformationReasonField.fill('E2E test');
    await dialog.getByRole('button', { name: 'Approve' }).click();
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
