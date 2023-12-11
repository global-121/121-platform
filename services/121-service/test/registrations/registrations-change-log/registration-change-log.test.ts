import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import {
  getRegistrationChangeLog,
  importRegistrations,
  updateRegistration,
} from '../../helpers/registration.helper';
import { getAccessToken, resetDB } from '../../helpers/utility.helper';
import {
  referenceIdVisa,
  registrationVisa,
} from '../../../seed-data/mock/visa-card.data';

const reason = 'automated test';

describe('Get and update registration change log', () => {
  const programId = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registrationVisa], accessToken);
  });

  it('should keep a log of registration data changes', async () => {
    // Arrange
    const data = {
      phoneNumber: '15005550099', //changed value
    };

    // Act
    await updateRegistration(
      programId,
      referenceIdVisa,
      data,
      reason,
      accessToken,
    );

    const response = await getRegistrationChangeLog(
      programId,
      referenceIdVisa,
      accessToken,
    );

    // Assert
    const body = response.body;
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(body.length).toBe(1);

    const checkingMap1 = {
      registrationId: 1,
      userId: 1,
      fieldName: 'phoneNumber',
      oldValue: registrationVisa.phoneNumber,
      newValue: data.phoneNumber,
      reason: reason,
    };
    for (const [key, value] of Object.entries(checkingMap1)) {
      expect(body[0][key]).toBe(value);
    }
  });

  it('should not log if value did not change', async () => {
    // Arrange
    const data = {
      firstName: 'Jane', //unchanged value
    };

    // Act
    await updateRegistration(
      programId,
      referenceIdVisa,
      data,
      reason,
      accessToken,
    );

    const response = await getRegistrationChangeLog(
      programId,
      referenceIdVisa,
      accessToken,
    );

    // Assert
    const body = response.body;
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(body.length).toBe(0);
  });

  it('should return empty array for unkown referenceId', async () => {
    // Arrange
    const wrongReferenceId = referenceIdVisa + '-fail-test';

    // Act
    const response = await getRegistrationChangeLog(
      programId,
      wrongReferenceId,
      accessToken,
    );

    // Assert
    const body = response.body;
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(body.length).toBe(0);
  });
});
