import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  duplicateRegistrationsAndPaymentData,
  getRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

// eslint-disable-next-line n/no-process-env -- Required to detect high data volume mode for performance testing
const isHighDataVolume = process.env.HIGH_DATA_VOLUME === 'true';

// Timing configuration
const testTimeout = 10 * 60 * 1000; // Overall test timeout to prevent hanging
const maximumQueryTime = 2 * 60 * 1000; // Performance assertion limit for the duplicates query

// Performance test configuration
// For guaranteeing that test data generates duplicates we should use at least 10 as minimal duplication number for fast test and 17 for full load test
const duplicateLowNumber = 10;
const duplicateHighNumber = 17; // cronjob duplicate number should be 2^17 = 131072

const duplicateNumber = isHighDataVolume
  ? duplicateHighNumber
  : duplicateLowNumber;

const totalRegistrations = Math.pow(2, duplicateNumber);

const queryParams = {
  'filter.duplicateStatus': 'duplicate',
};

jest.setTimeout(testTimeout);

describe('Find duplicates in 100k registrations within expected range', () => {
  let accessToken: string;

  it('Should find duplicates within time threshold', async () => {
    // Arrange
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
    // Upload registration
    const importRegistrationResponse = await importRegistrations(
      programIdOCW,
      [registrationVisa],
      accessToken,
    );
    expect(importRegistrationResponse.statusCode).toBe(HttpStatus.CREATED);
    // Duplicate registration to be more than 100k
    const duplicateRegistrationsResponse =
      await duplicateRegistrationsAndPaymentData({
        powerNumberRegistration: duplicateNumber,
        numberOfPayments: 0,
        accessToken,
        body: {
          secret: env.RESET_SECRET,
        },
      });
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);
    // Act - Start timer here to measure only the duplicates query performance
    const startTime = performance.now();
    // Query for duplicate registrations
    const findDuplicatesResponse = await getRegistrations({
      programId: programIdOCW,
      filter: queryParams,
      accessToken,
    });

    const elapsedTime = performance.now() - startTime;

    // Assert
    expect(elapsedTime).toBeLessThan(maximumQueryTime);
    expect(findDuplicatesResponse.statusCode).toBe(HttpStatus.OK);

    const duplicatesFound = findDuplicatesResponse.body.meta.totalItems;
    const minExpectedDuplicates = Math.floor(totalRegistrations * 0.02);
    const maxExpectedDuplicates = Math.floor(totalRegistrations * 0.1);

    expect(duplicatesFound).toBeGreaterThan(minExpectedDuplicates);
    expect(duplicatesFound).toBeLessThan(maxExpectedDuplicates);
  });
});
