import { HttpStatus } from '@nestjs/common';
import { registrationVisa } from '../../seed-data/mock/visa-card.data';
import { DebugScope } from '../../src/scripts/enum/debug-scope.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  importRegistrations,
  searchRegistrationByReferenceId,
  updateRegistration,
} from '../helpers/registration.helper';
import {
  getAccessToken,
  getAccessTokenScoped,
  resetDB,
} from '../helpers/utility.helper';
import { registrationPvScoped } from './pagination/pagination-data';

const updatePhoneNumber = '15005550099';

describe('Update attribute of PA', () => {
  const programIdPv = 2;
  const programIdOcw = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programIdOcw, [registrationVisa], accessToken);
    await importRegistrations(programIdPv, [registrationPvScoped], accessToken);
  });

  it('should not update unknown registration', async () => {
    // Arrange
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
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
  });

  it('should succesfully update', async () => {
    // Arrange
    const reason = 'automated test';
    const dataUpdateSucces = {
      phoneNumber: updatePhoneNumber,
      firstName: 'Jane',
      maxPayments: 2,
      paymentAmountMultiplier: 3,
    };

    // Act
    const response = await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataUpdateSucces,
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
    expect(registration.phoneNumber).toBe(updatePhoneNumber);
    expect(registration.firstName).toBe(dataUpdateSucces.firstName);
    expect(registration.maxPayments).toBe(dataUpdateSucces.maxPayments);
    expect(registration.paymentAmountMultiplier).toBe(
      dataUpdateSucces.paymentAmountMultiplier,
    );
    // Is old data still the same?
    expect(registration.lastName).toBe(registrationVisa.lastName);
  });

  it('should fail on wrong phonenumber', async () => {
    // Arrange
    const updatePhoneNumber = '150';
    const dataUpdatePhoneFail = {
      firstName: 'Jane',
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
    expect(registration.firstName).toBe(registrationVisa.firstName);
    // Is old data still the same?
    expect(registration.lastName).toBe(registrationVisa.lastName);
  });

  it('should fail on duplicate referenceId', async () => {
    // Arrange
    const registrationVisa2 = {
      ...registrationVisa,
      referenceId: 'duplicate-reference-id',
    };
    await importRegistrations(programIdOcw, [registrationVisa2], accessToken);
    const dataUpdateReferenceIdFail = {
      firstName: 'Jane',
      referenceId: registrationVisa2.referenceId,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataUpdateReferenceIdFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    response.body;
    const result = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programIdOcw,
      accessToken,
    );
    const registration = result.body.data[0];

    expect(registration.phoneNumber).toBe(registrationVisa.phoneNumber);
    expect(registration.firstName).toBe(registrationVisa.firstName);
    expect(registration.paymentAmountMultiplier).toBe(
      registrationVisa.paymentAmountMultiplier,
    );

    // Is old data still the same?
    expect(registration.firstName).toBe(registrationVisa.firstName);
  });

  it('should fail on short referenceId', async () => {
    // Arrange
    const registrationVisa2 = {
      ...registrationVisa,
      referenceId: 'shor', //t
    };
    await importRegistrations(programIdOcw, [registrationVisa2], accessToken);
    const dataUpdateReferenceIdFail = {
      firstName: 'Jane',
      referenceId: registrationVisa2.referenceId,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programIdOcw,
      registrationVisa.referenceId,
      dataUpdateReferenceIdFail,
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
    expect(registration.firstName).toBe(registrationVisa.firstName);
  });

  it('should update scope within current users scope', async () => {
    // Arrange
    const newScope = 'utrecht.houten';
    const reason = 'automated test';
    const updateDto = {
      scope: newScope,
    };
    accessToken = await getAccessTokenScoped(DebugScope.Utrecht);

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
    console.log('registration: ', registration);

    // Assert
    expect(updateResponse.statusCode).toBe(HttpStatus.OK);
    expect(registration.scope).toBe(newScope);
  });

  it('should not update scope outside current users scope', async () => {
    // Arrange
    const oldScope = registrationPvScoped.scope;
    const newScope = 'zeeland';
    const reason = 'automated test';
    const updateDto = {
      scope: newScope,
    };
    accessToken = await getAccessTokenScoped(DebugScope.Utrecht);

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
});
