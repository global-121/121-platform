import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { importRegistrationsCSV } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

const csvFilePath =
  './test-registration-data/test-registrations-westeros-1000.csv';
const testTimeout = 600_000; // 10 minutes

// eslint-disable-next-line n/no-process-env -- Required to detect high data volume mode for performance testing
const isHighDataVolume = process.env.HIGH_DATA_VOLUME === 'true';
const registrationCount = isHighDataVolume ? 1000 : 10;

jest.setTimeout(testTimeout);
describe(`Import ${registrationCount} registrations`, () => {
  let accessToken: string;
  let tempCsvPath: string | null = null;

  afterAll(() => {
    // Clean up temp file if created
    if (tempCsvPath && fs.existsSync(tempCsvPath)) {
      fs.unlinkSync(tempCsvPath);
    }
  });

  it(`Should import ${registrationCount} registrations with successful status`, async () => {
    // Arrange
    await resetDB(SeedScript.testMultiple, __filename);
    accessToken = await getAccessToken();

    let importPath = csvFilePath;

    // If not high data volume, create a temp CSV with only the first 10 rows
    if (!isHighDataVolume) {
      const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
      const lines = csvContent.split('\n');
      // Take header + first 10 data rows
      const limitedLines = lines.slice(0, registrationCount + 1);
      const limitedCsvContent = limitedLines.join('\n');

      tempCsvPath = path.join(
        os.tmpdir(),
        `test-registrations-${Date.now()}.csv`,
      );
      fs.writeFileSync(tempCsvPath, limitedCsvContent);
      importPath = tempCsvPath;
    }

    // Assert
    // Import registrations
    const registrationImportResponse = await importRegistrationsCSV(
      programIdPV,
      importPath,
      accessToken,
    );
    expect(registrationImportResponse.statusCode).toBe(HttpStatus.CREATED);
  });
});
