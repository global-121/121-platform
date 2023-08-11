import { HttpStatus } from '@nestjs/common';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import {
  importRegistrations,
  searchRegistrationByReferenceId,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { referenceIdVisa, registrationVisa } from '../visa-card/visa-card.data';

describe('Update attribute of PA', () => {
  const programId = 3;

  let accessToken: string;

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
    accessToken = await getAccessToken();
  });

  it('should import registrations', async () => {
    // Act
    const response = await importRegistrations(
      programId,
      [registrationVisa],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      referenceIdVisa,
      programId,
      accessToken,
    );
    const registration = result.body[0];
    for (const key in registrationVisa) {
      if (key === 'fspName') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registration['fsp']).toBe(registrationVisa[key]);
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registration[key]).toBe(registrationVisa[key]);
      }
    }
  });
});
