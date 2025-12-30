import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  duplicateRegistrationsAndPaymentData,
  exportAllRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { calculateMilliseconds } from '@121-service/test/performance/helpers/performance.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

const duplicateLowNumber = 5;
const duplicateHighNumber = 17; // cronjob duplicate number should be 2^17 = 131072
const testTimeout = calculateMilliseconds({ minutes: 3 }); // Overall test timeout to prevent hanging
const maximumExportTime = calculateMilliseconds({ minutes: 2.5 }); // Performance assertion limit for export operation
const duplicateNumber =
  // eslint-disable-next-line n/no-process-env -- Required to detect high data volume mode for performance testing
  process.env.HIGH_DATA_VOLUME === 'true'
    ? duplicateHighNumber
    : duplicateLowNumber;

jest.setTimeout(testTimeout);

let accessToken: string;

it('Export 100K+ registrations', async () => {
  // Arrange
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

  // Act - Start timer here to measure only export performance
  const startTime = performance.now();
  // Export registrations
  const exportResponse = await exportAllRegistrations(
    programIdOCW,
    accessToken,
  );

  // Assert
  expect(exportResponse.statusCode).toBe(HttpStatus.OK);

  // Verify we exported a significant number of registrations
  const expectedMinimumNumberOfRegistrations =
    duplicateNumber === duplicateHighNumber ? 100000 : 25;
  expect(exportResponse.body.data.length).toBeGreaterThan(
    expectedMinimumNumberOfRegistrations,
  );
  const elapsedTime = performance.now() - startTime;
  expect(elapsedTime).toBeLessThan(maximumExportTime);
});
