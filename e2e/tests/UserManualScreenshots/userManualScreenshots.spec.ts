import { test } from '@playwright/test';
import { Page } from 'playwright';

import { AppRoutes } from '@121-portal/src/app/app-routes.enum';
import { BulkActionId } from '@121-portal/src/app/models/bulk-actions.models';
import englishTranslations from '@121-portal/src/assets/i18n/en.json';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { importRegistrationsCSV } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

import Helpers from '@121-e2e/pages/Helpers/Helpers';
import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import ProgramTeam from '@121-e2e/pages/ProgramTeam/ProgramTeamPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import UsersAndRoles from '@121-e2e/pages/UsersAndRoles/UsersAndRolesPage';

const TIMEOUT_DURATION = 200;
const PROGRAM_ID = 3;
const OK = englishTranslations.common.ok;
const actions =
  englishTranslations['registration-details']['activity-overview'].actions;
const save = englishTranslations.common.save;
const arabic =
  englishTranslations.page.program['program-people-affected'].language.ar;

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

let accessToken: string;

test.beforeEach(async () => {
  accessToken = await getAccessToken();
  await resetDB(SeedScript.nlrcMultiple);
  await importRegistrationsCSV(
    programIdOCW,
    './test-registration-data/test-registrations-OCW.csv',
    accessToken,
  );
});

test.skip('Navigates to the portal and takes screenshots', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const helpers = new Helpers(page);
  const homePage = new HomePage(page);
  const usersAndRoles = new UsersAndRoles(page);
  const programTeam = new ProgramTeam(page);
  const registration = new RegistrationDetails(page);
  const table = new TableModule(page);

  await page.goto(AppRoutes.login);
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
    page,
    helpers,
    url: '/user',
    fileName: 'ChangePassword',
  });

  await navigateAndScreenshot({
    page,
    helpers,
    url: '/users',
    fileName: 'ListofUsers',
  });

  await usersAndRoles.navigateRolesTab();
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({ fileName: 'UsersRoleTab' });

  await navigateAndScreenshot({
    page,
    helpers,
    url: `/program/${PROGRAM_ID}/team`,
    fileName: 'ProgramTeam',
  });

  await programTeam.clickEditTeamMember({});
  await helpers.takeFullScreenShot({ fileName: 'ChangeRoleTeam' });

  await page.reload();
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

  await page.reload();
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

  await navigateAndScreenshot({
    page,
    helpers,
    url: `/program/${PROGRAM_ID}/overview`,
    fileName: 'ProgramDetails',
  });

  await helpers.takePartialScreenshot({
    elementId: 'design-table-element',
    fileName: 'ProgramDetailsTable',
  });

  await page.goto(`/program/${PROGRAM_ID}/people-affected`);
  await page.waitForTimeout(1000);
  await helpers.takeFullScreenShot({
    fileName: 'RegistrationPageOverview',
  });

  await table.openFspProfile({ shouldIncludeVisa: true });
  await registration.clickActionButton({
    button: actions,
  });
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({
    fileName: 'ActionButtonOverviewPAproile',
  });

  await page.reload();
  await helpers.takeFullScreenShot({
    fileName: 'RegistrationdetailsoverviewPA',
  });

  await registration.openEditPaPopUp();
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({
    fileName: 'PopupPAdetailsShowAll',
  });

  await registration.openReasonForChangePopUp({
    language: arabic,
    saveButtonName: save,
  });
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({
    fileName: 'ChangewithreasonPAprofile',
  });

  await page.goto(`${AppRoutes.program}/${PROGRAM_ID}/registrationValidation`);
  await table.openFilterDropdown();
  await helpers.takeFullScreenShot({
    fileName: 'FilterFunctionFieldsSearch',
  });

  await page.reload();
  await table.openStatusFilterDropdown();
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({
    fileName: 'FilterFunctionStatusSearch',
  });

  // SCREENSHOT CANNOT BE MADE BECAUSE ELEMENT IS NOT VISIBLE IN DOM

  // await page.reload();
  // await table.openBulkActionDropdown();
  // await page.waitForTimeout(1000);
  // await helpers.takeFullScreenShot({
  //   fileName: 'RegistrationActionList',
  // });

  await page.reload();
  await table.openDataExportDropdown();
  await page.waitForTimeout(TIMEOUT_DURATION);
  await helpers.takeFullScreenShot({
    fileName: 'RegistrationExportButton',
  });

  await page.reload();
  await table.openImportPopUp();
  await helpers.takeFullScreenShot({
    fileName: 'RegistrationImportFile',
  });

  await page.reload();
  await table.selectBulkAction({ option: BulkActionId.markAsDeclined });
  await helpers.takeFullScreenShot({
    fileName: 'RegistrationRejected',
  });

  await page.reload();
  await table.quickFilter('mock');
  await table.applyBulkAction(BulkActionId.include);
  await helpers.clickButton({ buttonName: OK });
  await helpers.clickButton({ buttonName: OK });

  await table.quickFilter('spent');
  await table.applyBulkAction(BulkActionId.markAsDeclined);
  await helpers.clickButton({ buttonName: OK });
  await helpers.clickButton({ buttonName: OK });

  await navigateAndScreenshot({
    page,
    helpers,
    url: `/program/${PROGRAM_ID}/people-affected`,
    fileName: 'PeopleAffectedDifferentStatus',
  });
});
