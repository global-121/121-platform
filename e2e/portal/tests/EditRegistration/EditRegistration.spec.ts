import { type Page, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  getRegistrationIdByReferenceId,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import {
  dropdownInputs,
  numberInputs,
  textInputs,
} from '@121-e2e/portal/helpers/PersonalInformationFields';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portal/pages/RegistrationActivityLogPage';
import RegistrationPersonalInformationPage from '@121-e2e/portal/pages/RegistrationPersonalInformationPage';

let registrationId: number;

const reset = async () => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);
  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });
};

const login = async (page: Page, email?: string, password?: string) => {
  const loginPage = new LoginPage(page);
  await page.goto(`/`);
  await loginPage.login(email, password);
};

const goToEditPersonalInformationPage = async (page: Page) => {
  const activityLogPage = new RegistrationActivityLogPage(page);
  await activityLogPage.goto(
    `/program/${programIdPV}/registrations/${registrationId}`,
  );
  await activityLogPage.navigateToPersonalInformation();
};

test.describe('Edit all the fields in registration Personal Information', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    await reset();
    page = await browser.newPage();
    await login(page);
    await goToEditPersonalInformationPage(page);
  });

  test.beforeEach(async () => {
    const personalInformationPage = new RegistrationPersonalInformationPage(
      page,
    );
    await personalInformationPage.clickEditInformationButton();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('Edit: Dropdown Selection fields', async () => {
    const personalInformationPage = new RegistrationPersonalInformationPage(
      page,
    );
    await personalInformationPage.selectDropdownOption({
      dropdownIdName: 'preferredLanguage',
      dropdownLabel: dropdownInputs.preferredLanguage.fieldName,
      option: 'Indonesian',
    });
    await personalInformationPage.saveChanges();
    await personalInformationPage.validateToastMessageAndClose(
      'Personal information edited successfully.',
    );
    // Validate the selected option
    await personalInformationPage.validatePersonalInformationField({
      fieldName: dropdownInputs.preferredLanguage.fieldName,
      fieldValue: 'Indonesian',
    });
  });

  test('Edit: Text Input fields', async () => {
    const personalInformationPage = new RegistrationPersonalInformationPage(
      page,
    );
    // Fill all text inputs
    for (const [textInputIdName, data] of Object.entries(textInputs)) {
      await personalInformationPage.fillTextInput({
        textInputIdName,
        textInputValue: data.textInputValue,
      });
    }
    await personalInformationPage.saveChanges();
    // Validate all text fields
    // If count is included and is greater than 1, it means that the field is repeated
    // in the personal information page and should be validated multiple times Scope
    for (const [_textInputIdName, data] of Object.entries(textInputs)) {
      if (!('count' in data) || data.count === 1) {
        await personalInformationPage.validatePersonalInformationField({
          fieldName: data.fieldName,
          fieldValue: data.textInputValue,
        });
      } else {
        await personalInformationPage.validateMultipleFieldsAtOnce({
          fieldName: data.fieldName,
          fieldValue: data.textInputValue,
          expectedCount: data.count,
        });
      }
    }
    await personalInformationPage.validateRegistrationTitle(
      textInputs.name.textInputValue,
    );
  });

  test('Edit: Number Input fields', async () => {
    const personalInformationPage = new RegistrationPersonalInformationPage(
      page,
    );
    // Fill all number inputs
    for (const [numberInputIdName, data] of Object.entries(numberInputs)) {
      await personalInformationPage.fillNumberInput({
        numberInputIdName,
        numberInputValue: data.numberInputValue,
      });
    }
    await personalInformationPage.saveChanges();
    // Validate all number fields
    for (const [_numberInputIdName, data] of Object.entries(numberInputs)) {
      await personalInformationPage.validatePersonalInformationField({
        fieldName: data.fieldName,
        fieldValue: String(data.numberInputValue),
      });
    }
  });
});
