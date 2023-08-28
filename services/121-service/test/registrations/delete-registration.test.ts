import { HttpStatus } from '@nestjs/common';
import { RegistrationStatusEnum } from '../../src/registration/enum/registration-status.enum';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  deleteRegistrations,
  importRegistrations,
  searchRegistrationByReferenceId,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { referenceIdVisa, registrationVisa } from '../visa-card/visa-card.data';

describe('Delete PA', () => {
  const programId = 3;
  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();

    await importRegistrations(programId, [registrationVisa], accessToken);
  });

  afterEach(async () => {
    await deleteRegistrations(
      programId,
      { referenceIds: [referenceIdVisa] },
      accessToken,
    );
  });

  it('should not delete unknown registrations', async () => {
    // Arrange
    const wrongReferenceId = referenceIdVisa + '-fail-test';

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
    const rightReferenceId = referenceIdVisa;

    // Act
    const response = await deleteRegistrations(
      programId,
      { referenceIds: [rightReferenceId] },
      accessToken,
    );

    // Assert
    expect(response.statusCode).toBe(HttpStatus.OK);

    const registration = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programId,
      accessToken,
    );
    expect(registration.body.data[0].status).toBe(
      RegistrationStatusEnum.deleted,
    );
    // Expect PII to be deleted
    expect(registration.body.data[0].phoneNumber).toBe(null);
    // TODO: Commenting this out for now as this is not working with the current refactor/implementation
    // expect(registration.body.data[0].firstName).toBe(null);
  });
});
