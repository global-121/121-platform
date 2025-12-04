import { HttpStatus } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';

import { env } from '@121-service/src/env';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  bulkUpdateRegistrationsCSV,
  duplicateRegistrationsAndPaymentData,
  exportRegistrations,
  importRegistrations,
  jsonToCsv,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

const PERFORMANCE_TEST_SHARD = 1;
void PERFORMANCE_TEST_SHARD; // Used by CI workflow for test discovery
const duplicateLowNumber = 5;
const duplicateHighNumber = 15; // cronjob duplicate number should be 2^15 = 32768
const testTimeout = 120_000; // 120 seconds
const isPerformanceCronjob =
  // eslint-disable-next-line n/no-process-env -- Required to detect CI environment for performance testing
  process.env.CI === 'true' &&
  // eslint-disable-next-line n/no-process-env -- Required to detect GitHub Actions workflow name
  process.env.GITHUB_WORKFLOW?.includes('Test: Jest Performance Tests Cronjob');
const duplicateNumber = isPerformanceCronjob
  ? duplicateHighNumber
  : duplicateLowNumber;

jest.setTimeout(testTimeout);
describe('Bulk update 32k registrations', () => {
  let accessToken: string;

  it('Should import 32k registrations within time threshold', async () => {
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
    // Duplicate registration to be 32k
    const duplicateRegistrationsResponse =
      await duplicateRegistrationsAndPaymentData({
        powerNumberRegistration: duplicateNumber,
        accessToken,
        body: {
          secret: env.RESET_SECRET,
        },
      });
    expect(duplicateRegistrationsResponse.statusCode).toBe(HttpStatus.CREATED);
    // export registrations
    const exportRegistrationsResponse = await exportRegistrations(
      programIdOCW,
      'preferredLanguage',
      accessToken,
    );
    expect(exportRegistrationsResponse.statusCode).toBe(HttpStatus.OK);
    // change preferredLanguage to Arabic
    const responseObj = exportRegistrationsResponse.body;
    const registrations = responseObj.data;
    for (const registration of registrations) {
      registration.preferredLanguage = 'ar';
    }
    const csvFile = jsonToCsv(registrations);
    const tempFilePath = path.join(__dirname, 'registrations.csv');
    fs.writeFileSync(tempFilePath, csvFile);
    // batch update registrations and check if it takes less than X ms
    const startTime = Date.now();
    const bulkUpdate = await bulkUpdateRegistrationsCSV(
      programIdOCW,
      tempFilePath,
      accessToken,
      'bulk update',
    );
    const elapsedTime = Date.now() - startTime;
    // clean up temp file
    fs.unlinkSync(tempFilePath);
    // Assert
    expect(elapsedTime).toBeLessThan(20_000); // 20000 ms = 20 seconds
    expect(bulkUpdate.statusCode).toBe(HttpStatus.OK);
  });
});
