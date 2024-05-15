import Helpers from '@121-e2e/pages/Helpers/Helpers';
import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import ProgramTeam from '@121-e2e/pages/ProgramTeam/ProgramTeamPage';
import UsersAndRoles from '@121-e2e/pages/UsersAndRoles/UsersAndRolesPage';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';

test.beforeEach(async () => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;
  await seedPaidRegistrations(registrationsOCW, OcwProgramId);
});

test('Open the edit PA popup', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const helpers = new Helpers(page);
  const homePage = new HomePage(page);
  const usersAndRoles = new UsersAndRoles(page);
  const programTeam = new ProgramTeam(page);

  await test.step('Navigates to the portal and takes full or partial screenshots of elements from the page', async () => {
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
    await page.waitForTimeout(200);
    await helpers.takeFullScreenShot({ fileName: 'HomeMenuPage' });
    await page.goto('/user');
    await helpers.takeFullScreenShot({ fileName: 'ChangePassword' });
    await page.goto('/users');
    await helpers.takeFullScreenShot({ fileName: 'ListofUsers' });
    await usersAndRoles.navigateRolesTab();
    await page.waitForTimeout(200);
    await helpers.takeFullScreenShot({ fileName: 'UsersRoleTab' });
    await page.goto(`/program/${programIdOCW}/team`);
    await helpers.takeFullScreenShot({ fileName: 'ProgramTeam' });
    await programTeam.openAddNewTeamMemberPoUp();
    await programTeam.validateAddTeamMemberPopUpIsPresent();
    await page.waitForTimeout(200);
    await helpers.takeFullScreenShot({ fileName: 'AddTeamMember' });
  });
});
