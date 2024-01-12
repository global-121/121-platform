import { HttpStatus } from '@nestjs/common';
import { registrationVisaWithEmptyPhoneNumber } from '../../seed-data/mock/visa-card.data';
import { SeedScript } from '../../src/scripts/seed-script.enum';
import { patchProgram } from '../helpers/program.helper';
import {
  importRegistrations,
  searchRegistrationByReferenceId,
} from '../helpers/registration.helper';
import { getAccessToken, resetDB } from '../helpers/utility.helper';
import { programIdOCW } from './pagination/pagination-data';

describe('Import empty registration', () => {
  let accessToken: string;
  let programUpdate = {
    allowEmptyPhoneNumber: true,
  };

  beforeEach(async () => {
    await resetDB(SeedScript.nlrcMultiple);
  });

  it('should not import registrations', async () => {
    // Arrange
    accessToken = await getAccessToken();

    // Act
    const response = await importRegistrations(
      programIdOCW,
      [registrationVisaWithEmptyPhoneNumber],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);

    const result = await searchRegistrationByReferenceId(
      registrationVisaWithEmptyPhoneNumber.referenceId,
      programIdOCW,
      accessToken,
    );

    const registration = result.body.data;
    expect(registration).toHaveLength(0);
  });

  it('should import empty registrations', async () => {
    // Arrange
    accessToken = await getAccessToken();

    await patchProgram(programIdOCW, programUpdate, accessToken);

    // Act
    const response = await importRegistrations(
      programIdOCW,
      [registrationVisaWithEmptyPhoneNumber],
      accessToken,
    );

    expect(response.statusCode).toBe(HttpStatus.CREATED);

    const result = await searchRegistrationByReferenceId(
      registrationVisaWithEmptyPhoneNumber.referenceId,
      programIdOCW,
      accessToken,
    );
    const registration = result.body.data[0];
    for (const key in registrationVisaWithEmptyPhoneNumber) {
      if (key === 'fspName') {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registration['financialServiceProvider']).toBe(
          registrationVisaWithEmptyPhoneNumber[key],
        );
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(registration[key]).toBe(
          registrationVisaWithEmptyPhoneNumber[key],
        );
      }
    }
  });
});
