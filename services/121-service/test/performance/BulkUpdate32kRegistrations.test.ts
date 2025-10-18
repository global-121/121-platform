import { HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { registrationVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  bulkUpdateRegistrationsCSV,
  duplicateRegistrations,
  exportRegistrations,
  importRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { jsonToCsv } from '@121-service/test/performance/helpers/performance.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

jest.setTimeout(60000); // 60 seconds
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
    const duplicateRegistrationsResponse = await duplicateRegistrations(
      15,
      accessToken,
      {
        secret: 'fill_in_secret',
      },
    ); // 2^15 = 32768
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
    expect(elapsedTime).toBeLessThan(15714); // 15714 ms = 15.714 seconds
    expect(bulkUpdate.statusCode).toBe(HttpStatus.OK);
  });
});
