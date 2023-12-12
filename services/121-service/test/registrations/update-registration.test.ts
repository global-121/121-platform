import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  importRegistrations,
  searchRegistrationByReferenceId,
  updateRegistration,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import {
  referenceIdVisa,
  registrationVisa,
} from '../../seed-data/mock/visa-card.data';

const updatePhoneNumber = '15005550099';

describe('Update attribute of PA', () => {
  const programId = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registrationVisa], accessToken);
  });

  it('should not update unknown registration', async () => {
    // Arrange
    const wrongReferenceId = referenceIdVisa + '-fail-test';
    const updatePhoneData = {
      phoneNumber: updatePhoneNumber,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programId,
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
      programId,
      referenceIdVisa,
      dataUpdateSucces,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);

    const result = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programId,
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
      programId,
      referenceIdVisa,
      dataUpdatePhoneFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const result = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programId,
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
    const registrationVisa2 = { ...registrationVisa };
    registrationVisa2.referenceId = 'duplicate-reference-id';
    await importRegistrations(programId, [registrationVisa2], accessToken);
    const dataUpdateReferenceIdFail = {
      firstName: 'Jane',
      referenceId: registrationVisa2.referenceId,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programId,
      referenceIdVisa,
      dataUpdateReferenceIdFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    response.body;
    const result = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programId,
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
    const registrationVisa2 = { ...registrationVisa };
    registrationVisa2.referenceId = 'shor'; //t
    await importRegistrations(programId, [registrationVisa2], accessToken);
    const dataUpdateReferenceIdFail = {
      firstName: 'Jane',
      referenceId: registrationVisa2.referenceId,
    };
    const reason = 'automated test';

    // Act
    const response = await updateRegistration(
      programId,
      referenceIdVisa,
      dataUpdateReferenceIdFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const result = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programId,
      accessToken,
    );
    const registration = result.body.data[0];

    // Is old data still the same?
    expect(registration.firstName).toBe(registrationVisa.firstName);
  });
});
