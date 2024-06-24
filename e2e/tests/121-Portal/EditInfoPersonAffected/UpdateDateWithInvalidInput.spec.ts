import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import PersonalInformationPopUp from '@121-e2e/pages/PersonalInformationPopUp/PersonalInformationPopUp';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import ProgramTest from '@121-service/src/seed-data/program/program-test.json';
import { importRegistrationsCSV } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { expect, test } from '@playwright/test';
import { AppRoutes } from '../../../../interfaces/Portal/src/app/app-routes.enum';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';

let accessToken: string;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.test);
  const programIdWesteros = 1;
  accessToken = await getAccessToken();

  await importRegistrationsCSV(
    programIdWesteros,
    './test-registration-data/test-registrations-westeros-20.csv',
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28047] Update "date" answer with invalid value', async ({ page }) => {
  const table = new TableModule(page);
  const homePage = new HomePage(page);
  const piiPopUp = new PersonalInformationPopUp(page);

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(ProgramTest.titlePortal.en);
  });

  await test.step('Open information pop-up', async () => {
    await table.openPaPersonalInformation({});
  });

  await test.step('Update date with a string', async () => {
    const [dialog] = await Promise.all([
      page.waitForEvent('dialog'),
      piiPopUp.typeStringInDateInputForm({
        saveButtonName: englishTranslations.common.save,
      }),
    ]);
    expect(dialog.message()).toBe(
      englishTranslations.page.program['program-people-affected'][
        'edit-person-affected-popup'
      ]['error-alert']['invalid-date'],
    );
    await dialog.accept();
  });
});
