import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../../src/scripts/seed-script.enum';
import {
  getRegistrationChangeLog,
  importRegistrations,
  updateRegisrationPatch,
} from '../../helpers/registration.helper';
import { getAccessToken, resetDB } from '../../helpers/utility.helper';
import {
  referenceIdVisa,
  registrationVisa,
} from '../../visa-card/visa-card.data';

const data = {
  phoneNumber: '15005550099',
  firstName: 'Jane',
};
const reason = 'automated test';

describe('Update attribute of PA', () => {
  const programId = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registrationVisa], accessToken);

    await updateRegisrationPatch(
      programId,
      referenceIdVisa,
      data,
      reason,
      accessToken,
    );
  });

  it('should keep a log of registration data changes', async () => {
    // Act
    const response = await getRegistrationChangeLog(
      programId,
      referenceIdVisa,
      accessToken,
    );
    // Assert
    const body = response.body;
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(body.length).toBe(2);

    const checkingMap1 = {
      registrationId: 1,
      userId: 1,
      fieldName: 'phoneNumber',
      oldValue: registrationVisa.phoneNumber,
      newValue: data.phoneNumber,
      reason: reason,
    };
    const checkingMap2 = {
      registrationId: 1,
      userId: 1,
      fieldName: 'firstName',
      oldValue: registrationVisa.firstName,
      newValue: data.firstName,
      reason: reason,
    };
    for (const [key, value] of Object.entries(checkingMap1)) {
      expect(body[0][key]).toBe(value);
    }
    for (const [key, value] of Object.entries(checkingMap2)) {
      expect(body[1][key]).toBe(value);
    }
  });

  it('should return empty array for unkown referenceId', async () => {
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
