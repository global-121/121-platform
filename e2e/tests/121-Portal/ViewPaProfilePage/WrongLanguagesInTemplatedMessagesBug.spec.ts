import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import RegistrationDetails from '@121-e2e/pages/RegistrationDetails/RegistrationDetailsPage';
import TableModule from '@121-e2e/pages/Table/TableModule';
import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import messageTemplateNlrc from '@121-service/src/seed-data/message-template/message-template-nlrc-ocw.json';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';
import { test } from '@playwright/test';
import { BulkActionId } from '../../../../../121-platform/interfaces/Portal/src/app/models/bulk-actions.models';
import { AppRoutes } from '../../../../interfaces/Portal/src/app/app-routes.enum';
import englishTranslations from '../../../../interfaces/Portal/src/assets/i18n/en.json';

const programIdOCW = 3;
const OcwProgramId = programIdOCW;
const save = englishTranslations.common.save;
const ok = englishTranslations.common.ok;
const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const paymentFilterByTab =
  englishTranslations['registration-details']['activity-overview'].filters
    .message;
const arabic =
  englishTranslations.page.program['program-people-affected'].language.ar;
const dutch =
  englishTranslations.page.program['program-people-affected'].language.nl;
const whatsappGenericMessageNL =
  messageTemplateNlrc.whatsappGenericMessage.message.nl;
const whatsappGenericMessageAr =
  messageTemplateNlrc.whatsappGenericMessage.message.ar;
const selectFieldDropdownName =
  englishTranslations.page.program['program-people-affected']['action-inputs'][
    'placeholder-typeahead-placeholder'
  ];
const firstNameOption = NLRCProgram.programCustomAttributes[0].label.en;
const addPersonalizedFieldName =
  englishTranslations.page.program['program-people-affected']['action-inputs'][
    'add-placeholder'
  ];

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple);

  await seedPaidRegistrations(registrationsOCW, OcwProgramId);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto(AppRoutes.login);
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
});

test('[28005] Bug: Only English was enabled in templated messages', async ({
  page,
}) => {
  const table = new TableModule(page);
  const registration = new RegistrationDetails(page);
  const homePage = new HomePage(page);

  let paNumber = -1;

  await test.step('Should navigate to PA profile page and change the language to Arabic', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
    await table.selectTable('Payment');
    paNumber = await table.selectPaByLanguage({ language: dutch });
    await registration.openEditPaPopUp();
    await registration.validateEditPaPopUpOpened();
    await registration.changePreferredLanguage({
      language: arabic,
      saveButtonName: save,
      okButtonName: ok,
    });
  });

  await test.step('Send messages to two different PAs with different preferred languages', async () => {
    await page.goto(`${AppRoutes.program}/${programIdOCW}/payment`);
    await table.applyBulkAction(BulkActionId.sendMessage);
    await table.selectFieldsforCustomMessage({
      selectFieldDropdownName: selectFieldDropdownName,
      firstNameOption: firstNameOption,
      addPersonalizedFieldName: addPersonalizedFieldName,
      okButtonName: ok,
    });
  });

  await test.step('Validate messages are sent both in Arabic and Dutch', async () => {
    // Validate Arabic message
    await table.clickOnPaNumber(paNumber);
    await registration.openActivityOverviewTab(paymentFilterByTab);
    // Waiting for the request to finalize
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForLoadState('networkidle');
    // --------------- This is not a good method but given the circumastances no other wanted to work-------------------------
    await registration.validateMessageContent({
      messageContent: whatsappGenericMessageAr,
    });
    // Validate Dutch message
    await page.goto(`${AppRoutes.program}/${programIdOCW}/payment`);
    await table.selectPaByLanguage({ language: dutch });
    await registration.openActivityOverviewTab(paymentFilterByTab);
    await registration.validateMessageContent({
      messageContent: whatsappGenericMessageNL,
    });
  });
});
