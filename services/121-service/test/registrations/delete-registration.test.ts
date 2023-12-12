import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  deleteRegistrations,
  importRegistrations,
  searchRegistrationByReferenceId,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import {
  referenceIdVisa,
  registrationVisa,
} from '../../seed-data/mock/visa-card.data';

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
    await deleteRegistrations(programId, [referenceIdVisa], accessToken);
  });

  it('should not delete unknown registrations', async () => {
    // Arrange
    const wrongReferenceId = referenceIdVisa + '-fail-test';

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
    const rightReferenceId = referenceIdVisa;

    // Act
    const response = await deleteRegistrations(
      programId,
      [rightReferenceId],
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.ACCEPTED);

    const registration = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programId,
      accessToken,
    );
    // You cannot find delete PAs
    expect(registration.body.data.length).toBe(0);
  });
});
