import { HttpStatus } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { ExportType } from '@121-service/src/metrics/enum/export-type.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { exportRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  duplicateRegistrationsAndPaymentData,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

const duplicateLowNumber = 5;
const duplicateHighNumber = 17; // cronjob duplicate number should be 2^17 = 131072
const testTimeout = 5_400_000; // 90 minutes
const duplicateNumber =
  // eslint-disable-next-line n/no-process-env -- Required to detect high data volume mode for performance testing
  process.env.HIGH_DATA_VOLUME === 'true'
    ? duplicateHighNumber
    : duplicateLowNumber;

jest.setTimeout(testTimeout);
describe('Export High volume of registrations', () => {
  let accessToken: string;

  it('Setup, add registrations and export', async () => {
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

    // Export registrations
    console.log('Exporting registrations...');
    const startExportTime = Date.now();

    const exportResponse = await exportRegistrations(
      programIdOCW,
      ExportType.registrations,
      accessToken,
    );

    const exportDurationMs = Date.now() - startExportTime;
    expect(exportResponse.statusCode).toBe(HttpStatus.OK);
    console.log('exportResponse: ', exportResponse.body);

    console.log(`Export completed in ${exportDurationMs}ms`);
    console.log(
      `Total registrations exported: ${exportResponse.body.data.length}`,
    );

    const totalDurationMs = Date.now() - startTime;
    console.log(`Total test duration: ${totalDurationMs}ms`);

    // Verify we exported a significant number of registrations
    const expectedMinRegistrations =
      duplicateNumber === duplicateHighNumber ? 100000 : 25;
    expect(exportResponse.body.data.length).toBeGreaterThan(
      expectedMinRegistrations,
    );
  });
});
