import { HttpStatus } from '@nestjs/common';
import { FspName } from '../../src/fsp/enum/fsp-name.enum';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  deleteRegistrations,
  getRegistration,
  importRegistrations,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';

describe('Delete PA', () => {
  const programId = 3;
  const referenceId = 'referenceId-for-delete-pa-test';
  const registration = {
    referenceId: referenceId,
    preferredLanguage: 'en',
    paymentAmountMultiplier: 1,
    firstName: 'John',
    lastName: 'Smith',
    phoneNumber: '15005550099',
    fspName: FspName.intersolveVisa,
    whatsappPhoneNumber: '15005550099',
  };

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registration], accessToken);
  });

  afterEach(async () => {
    await deleteRegistrations(
      programId,
      { referenceIds: [referenceId] },
      accessToken,
    );
  });

  it('should not delete unknown registrations', async () => {
    // Arrange
    const wrongReferenceId = referenceId + '-fail-test';

    // Act
    const response = await deleteRegistrations(
      programId,
      { referenceIds: [wrongReferenceId] },
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(response.body.errors.length).not.toBe(0);
  });

  it('should succesfully delete', async () => {
    const rightReferenceId = referenceId;

    // Act
    const response = await deleteRegistrations(
      programId,
      { referenceIds: [rightReferenceId] },
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const registration = await getRegistration(referenceId, accessToken);

    expect(registration.body.registrationStatus).toBe(
      RegistrationStatusEnum.deleted,
    );
  });
});
