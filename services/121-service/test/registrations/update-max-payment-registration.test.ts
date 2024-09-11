import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import {
  searchRegistrationByReferenceId,
  seedPaidRegistrations,
  updateRegistration,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { registrationPvScoped } from '@121-service/test/registrations/pagination/pagination-data';
import { HttpStatus } from '@nestjs/common';

describe('Update maxPayments of PA', () => {
  const programIdPv = 2;
  const maxPayments = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    const registration = Object.assign({ maxPayments }, registrationPvScoped);
    await seedPaidRegistrations([registration], programIdPv);
  });

  it('should succesfully update maxPayments without status change', async () => {
    // Arrange
    const reason = 'automated test';
    const dataUpdateSucces = {
      maxPayments: maxPayments,
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
    expect(registration.maxPayments).toBe(maxPayments);
  });

  it('should fail on wrong maxPayments', async () => {
    const reason = 'automated test';

    // Arrange
    const dataUpdateMaxPaymentsFail = {
      maxPayments: 0,
    };

    // Act
    const response = await updateRegistration(
      programIdPv,
      registrationPvScoped.referenceId,
      dataUpdateMaxPaymentsFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const result = await searchRegistrationByReferenceId(
      registrationPvScoped.referenceId,
      programIdPv,
      accessToken,
    );

    const registration = result.body.data[0];

    // Is old data still the same?
    expect(registration.maxPayments).toBe(maxPayments);
  });

  it('should succesfully update maxPayments and change status to completed', async () => {
    // Arrange
    const status = 'completed';
    const reason = 'automated test';
    const dataUpdateSucces = {
      maxPayments: 1,
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
    expect(registration.maxPayments).toBe(dataUpdateSucces.maxPayments);
    expect(registration.status).toBe(status);
  });
});
