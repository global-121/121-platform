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

// For guaranteeing that test data generates duplicates we should use at least 10 as minimal duplication number for fast test and 17 for full load test
const duplicateLowNumber = 10; // cronjob duplicate number should be 2^17 = 131072
const duplicateHighNumber = 17;
const queryParams = {
  'filter.duplicateStatus': 'duplicate',
};
const testTimeout = 3 * 60 * 1000; // 3 minutes
const duplicateNumber =
  // eslint-disable-next-line n/no-process-env -- Required to detect high data volume mode for performance testing
  process.env.HIGH_DATA_VOLUME === 'true'
    ? duplicateHighNumber
    : duplicateLowNumber;
const totalRegistrations = Math.pow(2, duplicateNumber);

jest.setTimeout(testTimeout);
describe('Find duplicates in 100k registrations within expected range', () => {
  let accessToken: string;

  it('Should find duplicates within time threshold', async () => {
    // Arrange
    const startTime = Date.now();
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
     
    console.log(`[timing] resetDB: ${Date.now() - startTime}ms`);
    accessToken = await getAccessToken();
    // Upload registration
    const beforeImport = Date.now();
    const importRegistrationResponse = await importRegistrations(
      programIdOCW,
      [registrationVisa],
      accessToken,
    );
     
    console.log(`[timing] importRegistrations: ${Date.now() - beforeImport}ms`);
    expect(importRegistrationResponse.statusCode).toBe(HttpStatus.CREATED);
    // Duplicate registration to be more than 100k
    const beforeDuplicate = Date.now();
    const duplicateRegistrationsResponse =
      await duplicateRegistrationsAndPaymentData({
        powerNumberRegistration: duplicateNumber,
        numberOfPayments: 0,
        accessToken,
        body: {
          secret: env.RESET_SECRET,
        },
      });
     
    console.log(
      `[timing] duplicateRegistrationsAndPaymentData: ${Date.now() - beforeDuplicate}ms`,
    );
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);
    // Query for duplicate registrations
    const beforeQuery = Date.now();
    const findDuplicatesResponse = await getRegistrations({
      programId: programIdOCW,
      filter: queryParams,
      accessToken,
    });
     
    console.log(`[timing] getRegistrations: ${Date.now() - beforeQuery}ms`);
    const elapsedTime = Date.now() - startTime;
     
    console.log(`[timing] total: ${elapsedTime}ms`);
    // Assert
    expect(elapsedTime).toBeLessThan(testTimeout);
    expect(findDuplicatesResponse.statusCode).toBe(HttpStatus.OK);

    const duplicatesFound = findDuplicatesResponse.body.meta.totalItems;
    const minExpectedDuplicates = Math.floor(totalRegistrations * 0.02);
    const maxExpectedDuplicates = Math.floor(totalRegistrations * 0.1);

    expect(duplicatesFound).toBeGreaterThan(minExpectedDuplicates);
    expect(duplicatesFound).toBeLessThan(maxExpectedDuplicates);
  });
});
