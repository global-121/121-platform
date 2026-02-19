import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdPV,
  registrationsPV,
} from '@121-service/test/registrations/pagination/pagination-data';

import {
  customSharedFixture as test,
  expect,
} from '@121-e2e/portal/fixtures/fixture';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPV,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/registrations`,
  });
});

test('Validate that "Duplicate" banner is displayed in overview of duplicated registrations', async ({
  registrationsPage,
  registrationActivityLogPage,
  page,
}) => {
  const duplicateRegistrationA = registrationsPV[1]; // 'Jan Janssen'
  const duplicateRegistrationB = registrationsPV[2]; // 'Joost Herlembach'
  const uniqueRegistration = registrationsPV[0]; // 'Gemma Houtenbos'

  await test.step('Wait for registrations to load', async () => {
    const allRegistrationsCount = registrationsPV.length;
    await registrationsPage.waitForLoaded(allRegistrationsCount);
  });

  await test.step('Open registration page', async () => {
    await registrationsPage.goToRegistrationByName({
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

    const pages = page.context().pages();

    expect(pages).toHaveLength(2);

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
    await registrationsPage.goToRegistrationByName({
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
