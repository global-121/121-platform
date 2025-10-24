import { HttpStatus } from '@nestjs/common';
import { env } from 'process';

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

// For guaranteeing that test data generates duplicates we should use at least 10 as minimal duplication number for fast test and 17 for full load test
const duplicateNumber = parseInt(env.DUPLICATE_NUMBER || '10'); // cronjob duplicate number should be 2^17 = 131072
const queryParams = {
  'filter.duplicateStatus': 'duplicate',
};
const testTimeout = 120_000; // 120 seconds

jest.setTimeout(testTimeout);
describe('Find duplicates in 100k registrations within expected range', () => {
  let accessToken: string;

  it('Should find duplicates within time threshold', async () => {
    // Arrange
    const startTime = Date.now();
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
    const duplicateRegistrationsResponse = await duplicateRegistrations({
      powerNumberRegistration: duplicateNumber,
      accessToken,
      body: {
        secret: env.RESET_SECRET,
      },
    });
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);
    // Query for duplicate registrations
    const findDuplicatesResponse = await getRegistrations({
      programId: programIdOCW,
      filter: queryParams,
      accessToken,
    });
    const elapsedTime = Date.now() - startTime;
    // Assert
    expect(elapsedTime).toBeLessThan(testTimeout);
    expect(findDuplicatesResponse.statusCode).toBe(HttpStatus.OK);
    /* eslint-disable jest/no-conditional-expect */
    if (duplicateNumber === 10) {
      expect(findDuplicatesResponse.body.meta.totalItems).toBeGreaterThan(50);
      expect(findDuplicatesResponse.body.meta.totalItems).toBeLessThan(100);
    } else if (duplicateNumber === 17) {
      expect(findDuplicatesResponse.body.meta.totalItems).toBeGreaterThan(3000);
      expect(findDuplicatesResponse.body.meta.totalItems).toBeLessThan(10000);
    }
    // TODO: use fractions of total registrations in assert, to be flexible towards other duplicateNumber values
  });
});
