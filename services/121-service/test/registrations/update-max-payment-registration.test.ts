import { HttpStatus } from '@nestjs/common';

import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
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

describe('Update maxPayments of PA', () => {
  const projectIdPv = 2;
  const reason = 'automated test';
  const testPayments = 3;
  const dataUpdateSucces = {
    maxPayments: testPayments,
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    const registration = Object.assign(
      { maxPayments: testPayments },
      registrationPvScoped,
    );
    await seedPaidRegistrations([registration], projectIdPv);
  });

  it('should succesfully update maxPayments without status change', async () => {
    // Arrange
    const initialStatus = RegistrationStatusEnum.included;

    // Act
    const response = await updateRegistration(
      projectIdPv,
      registrationPvScoped.referenceId,
      dataUpdateSucces,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);

    const result = await searchRegistrationByReferenceId(
      registrationPvScoped.referenceId,
      projectIdPv,
      accessToken,
    );
    const registration = result.body.data[0];
    expect(registration.maxPayments).toBe(testPayments);
    expect(registration.status).toBe(initialStatus);
  });

  it('should fail on wrong maxPayments', async () => {
    // Arrange
    const dataUpdateMaxPaymentsFail = {
      maxPayments: 0,
    };

    // Act
    const response = await updateRegistration(
      projectIdPv,
      registrationPvScoped.referenceId,
      dataUpdateMaxPaymentsFail,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    const result = await searchRegistrationByReferenceId(
      registrationPvScoped.referenceId,
      projectIdPv,
      accessToken,
    );

    const registration = result.body.data[0];

    // Is old data still the same?
    expect(registration.maxPayments).toBe(testPayments);
  });

  it('should succesfully update maxPayments and change status to completed', async () => {
    // Arrange
    const status = RegistrationStatusEnum.completed;
    const dataUpdateMaxPaymentsSuccess = {
      maxPayments: 1,
    };

    // Act
    const response = await updateRegistration(
      projectIdPv,
      registrationPvScoped.referenceId,
      dataUpdateMaxPaymentsSuccess,
      reason,
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);

    const result = await searchRegistrationByReferenceId(
      registrationPvScoped.referenceId,
      projectIdPv,
      accessToken,
    );

    const registration = result.body.data[0];
    expect(registration.maxPayments).toBe(
      dataUpdateMaxPaymentsSuccess.maxPayments,
    );
    expect(registration.status).toBe(status);
  });
});
