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
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

// eslint-disable-next-line n/no-process-env -- Required to detect high data volume mode for performance testing
const isHighDataVolume = process.env.HIGH_DATA_VOLUME === 'true';

// Timing configuration
const testTimeout = 300_000; // Overall test timeout to prevent hanging, 5 minutes
const maximumExportTime = 120_000; // Performance assertion limit for export operation, 2 minutes

// Performance test configuration
const duplicateLowNumber = 5;
const duplicateHighNumber = 17; // cronjob duplicate number should be 2^17 = 131072

const duplicateNumber = isHighDataVolume
  ? duplicateHighNumber
  : duplicateLowNumber;

jest.setTimeout(testTimeout);

it('Export 100K+ registrations', async () => {
  // Arrange
  await resetDB({ seedScript: SeedScript.nlrcMultiple });
  const accessToken = await getAccessToken();

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
