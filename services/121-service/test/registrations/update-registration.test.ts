import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { DebugScope } from '@121-service/src/scripts/enum/debug-scope.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  patchProgram,
  patchProgramRegistrationAttribute,
  setAllProgramsRegistrationAttributesNonRequired,
} from '@121-service/test/helpers/program.helper';
import {
  importRegistrations,
  searchRegistrationByReferenceId,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdWesteros,
  registrationPvScoped,
  registrationWesteros1,
} from '@121-service/test/registrations/pagination/pagination-data';

const updatePhoneNumber = '15005550099';
const programIdPv = 2;
const programIdOcw = 3;

async function setupNlrcEnvironment() {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();

  await importRegistrations(programIdOcw, [registrationVisa], accessToken);
  await importRegistrations(programIdPv, [registrationPvScoped], accessToken);

  return accessToken;
}

describe('Update attribute of PA', () => {
  let accessToken: string;

  it('should not update unknown registration', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();
    const wrongReferenceId = registrationVisa.referenceId + '-fail-test';
    const updatePhoneData = {
      phoneNumber: updatePhoneNumber,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programIdOcw,
      wrongReferenceId,
      updatePhoneData,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
  });

  it('should succesfully update multiple fields', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();
    const reason = 'automated test';
    const dataUpdateSucces = {
      phoneNumber: updatePhoneNumber,
      fullName: 'Jane Doe',
      maxPayments: 2,
      paymentAmountMultiplier: 3,
    };

    // Act
    const response = await updateRegistration(
      programIdPv,
      registrationPvScoped.referenceId,
      dataUpdateSucces,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);

    const result = await searchRegistrationByReferenceId(
      registrationPvScoped.referenceId,
      programIdPv,
      accessToken,
    );
    const registration = result.body.data[0];
    expect(registration.phoneNumber).toBe(updatePhoneNumber);
    expect(registration.fullName).toBe(dataUpdateSucces.fullName);
    expect(registration.maxPayments).toBe(dataUpdateSucces.maxPayments);
    expect(registration.paymentAmountMultiplier).toBe(
      dataUpdateSucces.paymentAmountMultiplier,
    );
    // Is old data still the same?
    expect(registration.preferredLanguage).toBe(
      registrationPvScoped.preferredLanguage,
    );
  });

  it('should fail on wrong phonenumber', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();
    // Uses MockPhoneNumbers.LookupFail phonenumber
    const updatePhoneNumber = '16005550005';
    const dataUpdatePhoneFail = {
      fullName: 'Jane',
      phoneNumber: updatePhoneNumber,
    };

    const reason = 'automated test';
    // Act
    const response = await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataUpdatePhoneFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programIdOcw,
      accessToken,
    );
    const registration = result.body.data[0];

    // Is old data still the same?
    expect(registration.phoneNumber).toBe(registrationVisa.phoneNumber);
    expect(registration.fullName).toBe(registrationVisa.fullName);
    // Is old data still the same?
    expect(registration.fullName).toBe(registrationVisa.fullName);
  });

  it('should fail on updating financial data without the right permission', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();
    const dataUpdateFinanancialFail = {
      paymentAmountMultiplier: 5,
      referenceId: registrationVisa.referenceId,
    };
    const reason = 'automated test';

    const accessTokenNoFinancePermission = await getAccessToken(
      env.USERCONFIG_121_SERVICE_EMAIL_CVA_OFFICER,
      env.USERCONFIG_121_SERVICE_PASSWORD_CVA_OFFICER,
    );

    // Act
    const response = await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataUpdateFinanancialFail,
      reason,
      accessTokenNoFinancePermission,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);

    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programIdOcw,
      accessToken,
    );
    const registration = result.body.data[0];
    expect(registration.paymentAmountMultiplier).toBe(
      registrationVisa.paymentAmountMultiplier,
    );
  });

  it('should fail on updating non financial data without the right permission', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();
    const dataUpdateNonFinanancialFail = {
      phoneNumber: 5,
      referenceId: registrationVisa.referenceId,
    };
    const reason = 'automated test';

    const accessTokenNoFinancePermission = await getAccessToken(
      env.USERCONFIG_121_SERVICE_EMAIL_FINANCE_MANAGER,
      env.USERCONFIG_121_SERVICE_PASSWORD_FINANCE_MANAGER,
    );

    // Act
    const response = await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataUpdateNonFinanancialFail,
      reason,
      accessTokenNoFinancePermission,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);

    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programIdOcw,
      accessToken,
    );
    const registration = result.body.data[0];
    expect(registration.phoneNumber).toBe(registrationVisa.phoneNumber);
  });

  it('should update scope within current users scope', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();
    const newScope = 'turkana.turkana-north';
    const reason = 'automated test';
    const updateDto = {
      scope: newScope,
    };
    accessToken = await getAccessTokenScoped(DebugScope.Turkana);

    // Act
    const updateResponse = await updateRegistration(
      programIdPv,
      registrationPvScoped.referenceId,
      updateDto,
      reason,
      accessToken,
    );
    const getRegistrationResult = await searchRegistrationByReferenceId(
      registrationPvScoped.referenceId,
      programIdPv,
      accessToken,
    );
    const registration = getRegistrationResult.body.data[0];

    // Assert
    expect(updateResponse.statusCode).toBe(HttpStatus.OK);
    expect(registration.scope).toBe(newScope);
  });

  it('should not update scope outside current users scope', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();
    const oldScope = registrationPvScoped.scope;
    const newScope = 'zeeland';
    const reason = 'automated test';
    const updateDto = {
      scope: newScope,
    };
    accessToken = await getAccessTokenScoped(DebugScope.Turkana);

    // Act
    const updateResponse = await updateRegistration(
      programIdPv,
      registrationPvScoped.referenceId,
      updateDto,
      reason,
      accessToken,
    );
    const getRegistrationResult = await searchRegistrationByReferenceId(
      registrationPvScoped.referenceId,
      programIdPv,
      accessToken,
    );
    const registration = getRegistrationResult.body.data[0];

    // Assert
    expect(updateResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(registration.scope).toBe(oldScope);
  });

  it('should fail on removing a program registration attribute which is part of the fsp config and required', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();
    const dataUpdateStreetFail = {
      addressStreet: null,
      addressCity: 'Zaandam',
    };

    const reason = 'automated test';
    // Act
    const response = await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataUpdateStreetFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programIdOcw,
      accessToken,
    );
    const registration = result.body.data[0];

    // Is old data still the same?
    expect(registration.addressStreet).toBe(registrationVisa.addressStreet);
    expect(registration.addressCity).toBe(registrationVisa.addressCity);
  });

  it('should succeed on removing a program registration attribute which is part of the fsp config but not-required', async () => {
    // Arrange
    accessToken = await setupNlrcEnvironment();
    const dataUpdateAdditionSuccess = {
      addressHouseNumberAddition: null,
    };

    const reason = 'automated test';
    // Act
    const response = await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataUpdateAdditionSuccess,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programIdOcw,
      accessToken,
    );
    const registration = result.body.data[0];

    expect(registration.addressHouseNumberAddition == null).toBe(true);
  });

  it('should succeed on removing all program registration attributes of test program', async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();
    await importRegistrations(
      programIdWesteros,
      [registrationWesteros1],
      accessToken,
    );
    const programUpdate = {
      allowEmptyPhoneNumber: true,
    };
    await patchProgram(programIdWesteros, programUpdate, accessToken);

    await setAllProgramsRegistrationAttributesNonRequired(
      programIdWesteros,
      accessToken,
    );

    const dataUpdateToEmpty = {
      healthArea: null,
      dob: null,
      house: null,
      dragon: null,
      knowsNothing: null,
      phoneNumber: null,
      whatsappPhoneNumber: null,
      motto: null,
    };

    const reason = 'automated test';
    // Act
    const response = await updateRegistration(
      programIdWesteros,
      registrationWesteros1.referenceId,
      dataUpdateToEmpty,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    const result = await searchRegistrationByReferenceId(
      registrationWesteros1.referenceId,
      programIdWesteros,
      accessToken,
    );
    const registration = result.body.data[0];
    for (const key in dataUpdateToEmpty) {
      // Check if value is null
      expect(registration[key]).toBe(null);
    }
  });

  it('should fail when removing a required program registration attribute', async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();
    await importRegistrations(
      programIdWesteros,
      [registrationWesteros1],
      accessToken,
    );

    await patchProgramRegistrationAttribute({
      programRegistrationAttributeName: 'motto',
      programRegistrationAttribute: { isRequired: true },
      programId: programIdWesteros,
      accessToken,
    });

    const dataUpdateToEmpty = {
      motto: null,
    };

    const reason = 'automated test';
    // Act
    const response = await updateRegistration(
      programIdWesteros,
      registrationWesteros1.referenceId,
      dataUpdateToEmpty,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchSnapshot();
  });

  it('should succeed on removing clearable default registration attributes', async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();
    await importRegistrations(
      programIdWesteros,
      [registrationWesteros1],
      accessToken,
    );

    const dataUpdateToEmpty = {
      maxPayments: null,
      scope: null,
    };

    const reason = 'automated test';
    // Act
    const response = await updateRegistration(
      programIdWesteros,
      registrationWesteros1.referenceId,
      dataUpdateToEmpty,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);
    const result = await searchRegistrationByReferenceId(
      registrationWesteros1.referenceId,
      programIdWesteros,
      accessToken,
    );
    const registration = result.body.data[0];
    expect(registration.maxPayments).toBe(null);
    expect(registration.scope.length).toBe(0);
  });
});
