import { HttpStatus } from '@nestjs/common';
import { registrationVisa } from '../../../seed-data/mock/visa-card.data';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import {
  deleteRegistrations,
  getRegistrationChangeLog,
  importRegistrations,
  updateRegistration,
} from '../../helpers/registration.helper';
import { getAccessToken, resetDB } from '../../helpers/utility.helper';

const reason = 'automated test';

describe('Get and update registration change log', () => {
  const programId = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registrationVisa], accessToken);
  });

  beforeAll(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });
  beforeEach(async () => {
    await importRegistrations(programId, [registrationVisa], accessToken);
  });
  afterEach(async () => {
    await deleteRegistrations(
      programId,
      [registrationVisa.referenceId],
      accessToken,
    );
  });

  it('should keep a log of registration data changes', async () => {
    // Arrange
    const data = {
      phoneNumber: '15005550099', //changed value
    };

    // Act
    await updateRegistration(
      programId,
      registrationVisa.referenceId,
      data,
      reason,
      accessToken,
    );

    const response = await getRegistrationChangeLog(
      programId,
      registrationVisa.referenceId,
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
    expect(body[0]).toMatchObject(checkingMap1);
  });

  it('should not log if value did not change', async () => {
    // Arrange
    const data = {
      firstName: 'Jane', //unchanged value
    };

    // Act
    await updateRegistration(
      programId,
      registrationVisa.referenceId,
      data,
      reason,
      accessToken,
    );

    const response = await getRegistrationChangeLog(
      programId,
      registrationVisa.referenceId,
      accessToken,
    );

    // Assert
    const body = response.body;
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(body.length).toBe(0);
  });

  it('should return empty array for unkown referenceId', async () => {
    // Arrange
    const wrongReferenceId = registrationVisa.referenceId + '-fail-test';

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
