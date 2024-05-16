import Helpers from '@121-e2e/pages/Helpers/Helpers';
import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import ProgramTeam from '@121-e2e/pages/ProgramTeam/ProgramTeamPage';
import UsersAndRoles from '@121-e2e/pages/UsersAndRoles/UsersAndRolesPage';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import { Page } from 'playwright';

const TIMEOUT_DURATION = 200;
const PROGRAM_ID = 3;

async function navigateAndScreenshot({
  page,
  helpers,
  url,
  fileName,
}: {
  page: Page;
  helpers: Helpers;
  url: string;
  fileName: string;
}) {
  await page.goto(url);
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({ fileName });
}

test.beforeEach(async () => {
  await resetDB(SeedScript.nlrcMultiple);
  await seedPaidRegistrations(registrationsOCW, PROGRAM_ID);
});

test('Navigates to the portal and takes screenshots', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const helpers = new Helpers(page);
  const homePage = new HomePage(page);
  const usersAndRoles = new UsersAndRoles(page);
  const programTeam = new ProgramTeam(page);

  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await homePage.closeBrowserCompatibilityBanner();
  await helpers.takeFullScreenShot({ fileName: 'loginScreen' });
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
  await homePage.validateNumberOfActivePrograms(2);
  await helpers.takeFullScreenShot({ fileName: 'ProgramOverview' });
  await homePage.openMenu();
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({ fileName: 'HomeMenuPage' });

  await navigateAndScreenshot({
    page: page,
    helpers: helpers,
    url: '/user',
    fileName: 'ChangePassword',
  });
  await navigateAndScreenshot({
    page,
    helpers: helpers,
    url: '/users',
    fileName: 'ListofUsers',
  });

  await usersAndRoles.navigateRolesTab();
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({ fileName: 'UsersRoleTab' });

  await navigateAndScreenshot({
    page: page,
    helpers: helpers,
    url: `/program/${PROGRAM_ID}/team`,
    fileName: 'ProgramTeam',
  });

  await programTeam.openAddNewTeamMemberPoUp();
  await programTeam.validateAddTeamMemberPopUpIsPresent();
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({ fileName: 'AddTeamMember' });

  await programTeam.fillInTeamMemberName({ name: 'cva-manager@example.org' });
  await helpers.takeFullScreenShot({
    fileName: 'ProgramTeamMultipurposeCashTeamTabAddTeamMember',
  });

  await programTeam.openRolesDropdown();
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({ fileName: 'ProgramUserManagementRoles' });

  await navigateAndScreenshot({
    page: page,
    helpers: helpers,
    url: `/program/${PROGRAM_ID}/team`,
    fileName: 'ChangeRoleTeam',
  });

  await programTeam.clickDeleteTeamMember({});
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({
    fileName: 'ProgramTeamDeleteRemoveUserActionBox',
  });

  await programTeam.removeUser();
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({
    fileName: 'ProgramTeamDeleteRemoveUserValidation',
  });
});
