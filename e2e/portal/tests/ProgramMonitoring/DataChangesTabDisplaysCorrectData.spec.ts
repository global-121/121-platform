import { expect } from '@playwright/test';

import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { updateRegistration } from '@121-service/test/helpers/registration.helper';
import {
  programIdOCW,
  registrationOCW4,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import {
  dropdownInputs,
  numberInputs,
  textInputs,
} from '@121-e2e/portal/helpers/PersonalInformationFields';

const reason = 'automated test';

// Mapping between backend language codes and frontend display names
const languageCodeToDisplayName = {
  nl: 'Dutch',
  ar: 'Arabic',
};
// Define the fields to be tested along with their corresponding input field names
const dataFields = {
  phoneNumber: textInputs.phoneNumber.fieldName,
  whatsappPhoneNumber: textInputs.whatsappPhoneNumber.fieldName,
  fullName: textInputs.fullName.fieldName,
  addressCity: textInputs.addressCity.fieldName,
  addressStreet: textInputs.addressStreet.fieldName,
  addressHouseNumberAddition: textInputs.addressHouseNumberAddition.fieldName,
  addressPostalCode: textInputs.addressPostalCode.fieldName,
  paymentAmountMultiplier: numberInputs.paymentAmountMultiplier.fieldName,
  addressHouseNumber: numberInputs.addressHouseNumber.fieldName,
  preferredLanguage: dropdownInputs.preferredLanguage.fieldName,
};
// Data to update the registration with
const dataUpdate = {
  phoneNumber: '15005550099',
  whatsappPhoneNumber: '15005550099',
  fullName: 'Updated NameLuiz',
  paymentAmountMultiplier: 4,
  addressCity: 'NewCity',
  addressStreet: 'newStreet1',
  addressHouseNumber: '2',
  addressHouseNumberAddition: 'A',
  preferredLanguage: 'ar',
  addressPostalCode: '5678ZY',
};

test.beforeEach(async ({ resetDBAndSeedRegistrations, accessToken }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationOCW4],
    programId: programIdOCW,
  });

  // Make data changes
  const response = await updateRegistration(
    programIdOCW,
    registrationOCW4.referenceId,
    dataUpdate,
    reason,
    accessToken,
  );
  // Assert
  expect(response.statusCode).toBe(200);
});

test("All elements of Monitoring's `Data Changes` sub-page display correct data for Registration", async ({
  programMonitoringPage,
  tableComponent,
}) => {
  await test.step("Navigate to monitoring's 'data changes' tab", async () => {
    await programMonitoringPage.goto(
      `/program/${programIdOCW}/monitoring/dashboard`,
    );
    await programMonitoringPage.selectTab({ tabName: 'Data Changes' });
  });

  await test.step('Verify data changes are displayed correctly', async () => {
    // Loop through all the updated fields
    for (const [fieldKey, fieldName] of Object.entries(dataFields)) {
      await tableComponent.filterColumnByDropDownSelection({
        columnName: 'Field changed',
        selection: fieldName,
      });
      // Validate that only one row is displayed after filtering
      await tableComponent.validateWaitForTableRowCount({
        expectedRowCount: 1,
      });
      // Get expected values with language conversion if needed
      let expectedOldValue = registrationOCW4[fieldKey]?.toString() ?? '';
      let expectedNewValue = dataUpdate[fieldKey]?.toString() ?? '';
      // Convert language codes to display names for preferredLanguage field
      if (fieldKey === GenericRegistrationAttributes.preferredLanguage) {
        expectedOldValue =
          languageCodeToDisplayName[registrationOCW4[fieldKey]] ??
          expectedOldValue;
        expectedNewValue =
          languageCodeToDisplayName[dataUpdate[fieldKey]] ?? expectedNewValue;
      }
      // Validate old value (from registrationOCW4)
      await tableComponent.validateDataChangeValue({
        columnType: 'old',
        expectedValue: expectedOldValue,
      });
      // Validate new value (from dataUpdate)
      await tableComponent.validateDataChangeValue({
        columnType: 'new',
        expectedValue: expectedNewValue,
      });
      // Clear filter before next iteration
      await tableComponent.clearAllFilters();
    }
  });
});
