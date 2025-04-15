import { test } from '@playwright/test';

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
} from '@121-e2e/portalicious/helpers/PersonalInformationFields';
import LoginPage from '@121-e2e/portalicious/pages/LoginPage';
import RegistrationActivityLogPage from '@121-e2e/portalicious/pages/RegistrationActivityLogPage';
import RegistrationPersonalInformationPage from '@121-e2e/portalicious/pages/RegistrationPersonalInformationPage';

let registrationId: number;

// Arrange
test.beforeEach(async ({ page }) => {
  const accessToken = await getAccessToken();
  await resetDB(SeedScript.nlrcMultiple);

  await seedIncludedRegistrations([registrationPV5], programIdPV, accessToken);
  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });

  // Login
  const loginPage = new LoginPage(page);
  await loginPage.goto('/');
  await loginPage.login(
    process.env.USERCONFIG_121_SERVICE_EMAIL_ADMIN,
    process.env.USERCONFIG_121_SERVICE_PASSWORD_ADMIN,
  );
  // Navigate to program
  await loginPage.selectProgram('NLRC Direct Digital Aid Program (PV)');
  await loginPage.goto(
    `/project/${programIdPV}/registrations/${registrationId}`,
  );
});

test('[35234] Edit: FSP', async ({ page }) => {
  const personalInformationPage = new RegistrationPersonalInformationPage(page);
  const activityLogPage = new RegistrationActivityLogPage(page);

  await activityLogPage.navigateToPersonalInformation();
  await personalInformationPage.clickEditInformationButton();

  // Act
  // Change FSP from dropdown selection and fill in all the required fields
  await personalInformationPage.selectDropdownOption({
    dropdownIdName: 'programFinancialServiceProviderConfigurationName',
    dropdownLabel:
      dropdownInputs.programFinancialServiceProviderConfigurationName.fieldName,
    option: 'Visa debit card',
  });
  // Fill in all the required fields
  // It may be less than presented in this test but for the sake of the test we fill in all

  // Fill all text inputs
  for (const [textInputIdName, data] of Object.entries(textInputs)) {
    await personalInformationPage.fillTextInput({
      textInputIdName,
      textInputValue: data.textInputValue,
    });
  }
  // Fill all number inputs
  for (const [numberInputIdName, data] of Object.entries(numberInputs)) {
    await personalInformationPage.fillNumberInput({
      numberInputIdName,
      numberInputValue: data.numberInputValue,
    });
  }
  await personalInformationPage.saveChanges();
  // Assert
  await personalInformationPage.validatePersonalInformationField({
    fieldName:
      dropdownInputs.programFinancialServiceProviderConfigurationName.fieldName,
    fieldValue: 'Visa debit card',
  });
});
