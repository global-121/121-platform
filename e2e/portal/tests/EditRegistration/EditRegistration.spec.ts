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

test.describe('Edit all the fields in registration Personal Information', () => {
  test.beforeEach(
    async ({
      resetDBAndSeedRegistrations,
      registrationPersonalInformationPage,
    }) => {
      const { accessToken } = await resetDBAndSeedRegistrations({
        seedScript: SeedScript.nlrcMultiple,
        registrations: [registrationPV5],
        programId: programIdPV,
      });

      registrationId = await getRegistrationIdByReferenceId({
        programId: programIdPV,
        referenceId: registrationPV5.referenceId,
        accessToken,
      });

      await registrationPersonalInformationPage.goto(
        `/program/${programIdPV}/registrations/${registrationId}/personal-information`,
      );
      await registrationPersonalInformationPage.clickEditInformationButton();
    },
  );

  test('Edit: Dropdown Selection fields', async ({
    registrationPersonalInformationPage,
  }) => {
    await registrationPersonalInformationPage.selectDropdownOption({
      dropdownIdName: 'preferredLanguage',
      dropdownLabel: dropdownInputs.preferredLanguage.fieldName,
      option: 'Indonesian',
    });
    await registrationPersonalInformationPage.saveChanges();
    await registrationPersonalInformationPage.validateToastMessageAndClose(
      'Personal information edited successfully.',
    );
    // Validate the selected option
    await registrationPersonalInformationPage.validatePersonalInformationField({
      fieldName: dropdownInputs.preferredLanguage.fieldName,
      fieldValue: 'Indonesian',
    });
  });

  test('Edit: Text Input fields', async ({
    registrationPersonalInformationPage,
  }) => {
    // Fill all text inputs
    for (const [textInputIdName, data] of Object.entries(textInputs)) {
      await registrationPersonalInformationPage.fillTextInput({
        textInputIdName,
        textInputValue: data.textInputValue,
      });
    }
    await registrationPersonalInformationPage.saveChanges();
    // Validate all text fields
    // If count is included and is greater than 1, it means that the field is repeated
    // in the personal information page and should be validated multiple times Scope
    for (const [_textInputIdName, data] of Object.entries(textInputs)) {
      if (!('count' in data) || data.count === 1) {
        await registrationPersonalInformationPage.validatePersonalInformationField(
          {
            fieldName: data.fieldName,
            fieldValue: data.textInputValue,
          },
        );
      } else {
        await registrationPersonalInformationPage.validateMultipleFieldsAtOnce({
          fieldName: data.fieldName,
          fieldValue: data.textInputValue,
          expectedCount: data.count,
        });
      }
    }
    await registrationPersonalInformationPage.validateRegistrationTitle(
      textInputs.name.textInputValue,
    );
  });

  test('Edit: Number Input fields', async ({
    registrationPersonalInformationPage,
  }) => {
    // Fill all number inputs
    for (const [numberInputIdName, data] of Object.entries(numberInputs)) {
      await registrationPersonalInformationPage.fillNumberInput({
        numberInputIdName,
        numberInputValue: data.numberInputValue,
      });
    }
    await registrationPersonalInformationPage.saveChanges();
    // Validate all number fields
    for (const [_numberInputIdName, data] of Object.entries(numberInputs)) {
      await registrationPersonalInformationPage.validatePersonalInformationField(
        {
          fieldName: data.fieldName,
          fieldValue: String(data.numberInputValue),
        },
      );
    }
  });
});
