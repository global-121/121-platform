import { test } from '@playwright/test';

import { AppRoutes } from '@121-portal/src/app/app-routes.enum';
import englishTranslations from '@121-portal/src/assets/i18n/en.json';
import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { getFinancialServiceProviderSettingByNameOrThrow } from '@121-service/src/financial-service-providers/financial-service-provider-settings.helpers';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import programOcw from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import { resetDB } from '@121-service/test/helpers/utility.helper';
import { registrationsOCW } from '@121-service/test/registrations/pagination/pagination-data';

import HomePage from '@121-e2e/pages/Home/HomePage';
import LoginPage from '@121-e2e/pages/Login/LoginPage';
import PersonalInformationPopUp from '@121-e2e/pages/PersonalInformationPopUp/PersonalInformationPopUp';
import TableModule from '@121-e2e/pages/Table/TableModule';

const nlrcOcwProgrammeTitle = NLRCProgram.titlePortal.en;
const save = englishTranslations.common.save;
const ok = englishTranslations.common.ok;
const voucherFspName = getFinancialServiceProviderSettingByNameOrThrow(
  FinancialServiceProviders.intersolveVoucherWhatsapp,
).defaultLabel.en;
const visaFspName = getFinancialServiceProviderSettingByNameOrThrow(
  FinancialServiceProviders.intersolveVisa,
).defaultLabel.en;
const visaQuestionStreet = programOcw.programRegistrationAttributes.find(
  (attribute) => attribute.name === 'addressStreet',
)!.label.en;

const visaQuestionHouseNumberAddition =
  programOcw.programRegistrationAttributes.find(
    (attribute) => attribute.name === 'addressHouseNumberAddition',
  )!.label.en;

const visaQuestionPostalCode = programOcw.programRegistrationAttributes.find(
  (attribute) => attribute.name === 'addressPostalCode',
)!.label.en;

const visaQuestionCity = programOcw.programRegistrationAttributes.find(
  (attribute) => attribute.name === 'addressCity',
)!.label.en;

const visaQuestionHouseNumber = programOcw.programRegistrationAttributes.find(
  (attribute) => attribute.name === 'addressHouseNumber',
)!.label.en;

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

test('[28048] Update chosen Finacial service provider', async ({ page }) => {
  const table = new TableModule(page);
  const homePage = new HomePage(page);
  const piiPopUp = new PersonalInformationPopUp(page);

  let rowNumber: number;

  await test.step('Navigate to PA table', async () => {
    await homePage.navigateToProgramme(nlrcOcwProgrammeTitle);
  });

  await test.step('Open information pop-up', async () => {
    rowNumber = await table.selectFspPaPii({ shouldSelectVisa: false });
  });

  // Need to be fixed
  await test.step('Update Finacial service provider from Voucher whatsapp to Visa debit card', async () => {
    await piiPopUp.updatefinancialServiceProvider({
      fspNewName: visaFspName!,
      fspOldName: voucherFspName!,
      saveButtonName: save,
      okButtonName: ok,
      newAttributes: [
        { labelText: visaQuestionHouseNumber, newValue: '3' },
        { labelText: visaQuestionStreet, newValue: 'Nieuwe straat' },
        { labelText: visaQuestionHouseNumberAddition, newValue: 'D' },
        { labelText: visaQuestionPostalCode, newValue: '1234AB' },
        { labelText: visaQuestionCity, newValue: 'Amsterdam' },
      ],
    });
  });

  await test.step('Validate Finacial service provider be updated', async () => {
    await table.validateFspCell({
      rowNumber,
      fspName: visaFspName!,
    });
  });
});
