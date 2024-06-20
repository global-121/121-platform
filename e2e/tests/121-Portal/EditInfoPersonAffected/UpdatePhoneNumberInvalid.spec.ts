import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import PersonalInformationPopUp from '@121-e2e/pages/PersonalInformationPopUp/PersonalInformationPopUp';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28045] Update phoneNumber with invalid value', async ({ page }) => {
  const table = new TableModule(page);
  const homePage = new HomePage(page);
  const piiPopUp = new PersonalInformationPopUp(page);

  const alertPattern = englishTranslations.common['error-with-message'];
  function createAlertMessage(pattern: string, phoneNumber: string): string {
    const error = `The value '${phoneNumber}' given for the attribute 'phoneNumber' does not have the correct format for type 'tel'`;
    return pattern.replace('{{error}}', error);
  }

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(NLRCProgram.titlePortal.en);
  });

  await test.step('Open information pop-up', async () => {
    await table.openPaPersonalInformation({});
  });

  await test.step('Update phone number with empty string', async () => {
    const phoneNumber = '';
    await piiPopUp.updatePhoneNumber({
      phoneNumber: phoneNumber,
      saveButtonName: englishTranslations.common.save,
      okButtonName: englishTranslations.common.ok,
      alert: alertPattern.replace(
        '{{error}}',
        englishTranslations['page'].program['program-people-affected'][
          'edit-person-affected-popup'
        ].properties.error['not-empty'],
      ),
    });
  });

  await test.step('Update phone number with longer(18 digit) number', async () => {
    const phoneNumber = '123456789012345678';
    const alertMessage = createAlertMessage(alertPattern, phoneNumber);
    await piiPopUp.updatePhoneNumber({
      phoneNumber: phoneNumber,
      saveButtonName: englishTranslations.common.save,
      okButtonName: englishTranslations.common.ok,
      alert: alertMessage,
    });
  });

  await test.step('Update phone number with shorter(7 digit) number', async () => {
    const phoneNumber = '1234567';
    const alertMessage = createAlertMessage(alertPattern, phoneNumber);
    await piiPopUp.updatePhoneNumber({
      phoneNumber: phoneNumber,
      saveButtonName: englishTranslations.common.save,
      okButtonName: englishTranslations.common.ok,
      alert: alertMessage,
    });
  });
});
