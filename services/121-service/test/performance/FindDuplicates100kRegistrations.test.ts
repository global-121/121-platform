import { HttpStatus } from '@nestjs/common';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  duplicateRegistrations,
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

const queryParams = {
  'filter.duplicateStatus': 'duplicate',
};

jest.setTimeout(120000); // 80 seconds
describe('Find duplicates in 100k registrations within expected range', () => {
  let accessToken: string;

  it('Should find duplicates within time threshold', async () => {
    // Arrange
    const startTime = Date.now();
    const elapsedTime = Date.now() - startTime;
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();
    // Upload registration
    const importRegistrationResponse = await importRegistrations(
      programIdOCW,
      [registrationVisa],
      accessToken,
    );
    expect(importRegistrationResponse.statusCode).toBe(HttpStatus.CREATED);
    // Duplicate registration to be more than 100k
    const duplicateRegistrationsResponse = await duplicateRegistrations(
      17,
      accessToken,
      {
        secret: 'fill_in_secret',
      },
    ); // 2^17 = 131072
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);
    // Query for duplicate registrations
    const findDuplicatesResponse = await getRegistrations({
      programId: programIdOCW,
      filter: queryParams,
      accessToken,
    });
    // Assert
    expect(elapsedTime).toBeLessThan(120000); // 120000 ms = 120 seconds
    expect(findDuplicatesResponse.statusCode).toBe(HttpStatus.OK);
    expect(findDuplicatesResponse.body.meta.totalItems).toBeGreaterThan(3000);
    expect(findDuplicatesResponse.body.meta.totalItems).toBeLessThan(10000);
  });
});
