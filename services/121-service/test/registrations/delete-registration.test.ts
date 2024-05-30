import { SeedScript } from '@121-service/src/scripts/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  deleteRegistrations,
  importRegistrations,
  searchRegistrationByReferenceId,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { HttpStatus } from '@nestjs/common';

describe('Delete PA', () => {
  const programId = 3;
  let accessToken: string;

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

  it('should not delete unknown registrations', async () => {
    // Arrange
    const wrongReferenceId = registrationVisa.referenceId + '-fail-test';

    // Act
    const response = await deleteRegistrations(
      programId,
      [wrongReferenceId],
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.ACCEPTED);
    expect(response.body.totalFilterCount).toBe(0);
    expect(response.body.applicableCount).toBe(0);
  });

  it('should succesfully delete', async () => {
    const rightReferenceId = registrationVisa.referenceId;

    // Act
    const response = await deleteRegistrations(
      programId,
      [rightReferenceId],
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.ACCEPTED);

    const registration = await searchRegistrationByReferenceId(
      registrationVisa.referenceId,
      programId,
      accessToken,
    );
    // You cannot find delete PAs
    expect(registration.body.data.length).toBe(0);
  });
});
