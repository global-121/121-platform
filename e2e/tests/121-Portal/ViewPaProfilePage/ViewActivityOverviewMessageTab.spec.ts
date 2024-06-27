import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import { AppRoutes } from '../../../../interfaces/Portal/src/app/app-routes.enum';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const pageTitle = englishTranslations['registration-details'].pageTitle;
const paymentFilterByMessage =
  englishTranslations.entity.message['content-type']['generic-templated'];
const messageContext =
  englishTranslations.entity.message['content-type'].payment;
const messageType = englishTranslations.entity.message.type.whatsapp;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);
  const programIdOCW = 3;
  const OcwProgramId = programIdOCW;

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[27497] View Activity overview “Messages tab"', async ({ page }) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  await test.step('Should navigate to PA profile page in Payment table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
    await table.clickOnPaNumber(1);
  });

  await test.step('Validate the "Messages" tab on the PA Activity Overview table to Contain WhatsApp notifications and correct message content', async () => {
    await registration.validateHeaderToContainText(pageTitle);
    await registration.openActivityOverviewTab('Messages');
    await registration.validateSentMessagesTab({
      messageNotification: paymentFilterByMessage,
      messageContext: messageContext,
      messageType: messageType,
    });
  });
});
