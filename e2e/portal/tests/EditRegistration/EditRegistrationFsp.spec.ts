import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { getRegistrationIdByReferenceId } from '@121-service/test/helpers/registration.helper';
import {
  programIdPV,
  registrationPV5,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import {
  dropdownInputs,
  numberInputs,
  textInputs,
} from '@121-e2e/portal/helpers/PersonalInformationFields';

let registrationId: number;

// Arrange
test.beforeEach(async ({ page, resetDBAndSeedRegistrations, accessToken }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationPV5],
    programId: programIdPV,
  });

  registrationId = await getRegistrationIdByReferenceId({
    programId: programIdPV,
    referenceId: registrationPV5.referenceId,
    accessToken,
  });

  // Navigate to the Personal Information page of the seeded registration
  await page.goto(
    `/en-GB/program/${programIdPV}/registrations/${registrationId}`,
  );
});

test('Edit: FSP', async ({
  registrationPersonalInformationPage,
  registrationActivityLogPage,
}) => {
  await registrationActivityLogPage.navigateToPersonalInformation();
  await registrationPersonalInformationPage.clickEditInformationButton();

  // Act
  await registrationPersonalInformationPage.selectDropdownOption({
    dropdownIdName: 'programFspConfigurationName',
    dropdownLabel: dropdownInputs.programFspConfigurationName.fieldName,
    option: 'Visa debit card',
  });

  // Fill all text inputs
  for (const [textInputIdName, data] of Object.entries(textInputs)) {
    await registrationPersonalInformationPage.fillTextInput({
      textInputIdName,
      textInputValue: data.textInputValue,
    });
  }

  // Fill all number inputs
  for (const [numberInputIdName, data] of Object.entries(numberInputs)) {
    await registrationPersonalInformationPage.fillNumberInput({
      numberInputIdName,
      numberInputValue: data.numberInputValue,
    });
  }

  await registrationPersonalInformationPage.saveChanges();

  // Assert
  await registrationPersonalInformationPage.validatePersonalInformationField({
    fieldName: dropdownInputs.programFspConfigurationName.fieldName,
    fieldValue: 'Visa debit card',
  });
});
