import { HttpStatus } from '@nestjs/common/enums/http-status.enum';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { importRegistrationsCSV } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

const csvFilePath =
  './test-registration-data/test-registrations-westeros-1000.csv';

jest.setTimeout(450_000); // 7.5 minutes
describe('Import 1000 registrations', () => {
  let accessToken: string;

  it('Should import 1000 registrations with successful status', async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();

    // Assert
    // Import 1000 registrations
    const registrationImportResponse = await importRegistrationsCSV(
      2,
      csvFilePath,
      accessToken,
    );
    expect(registrationImportResponse.statusCode).toBe(HttpStatus.CREATED);
  });
});
