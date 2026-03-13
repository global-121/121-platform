import { expect } from '@playwright/test';
import path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { uploadAttachment } from '@121-service/test/helpers/program-attachments.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

let accessToken: string;

const pdfFilePath = path.resolve(
  __dirname,
  '../../../test-file-upload-data/test-pdf-document.pdf',
);
const docxFilePath = path.resolve(
  __dirname,
  '../../../test-file-upload-data/test-document.docx',
);
const pngFilePath = path.resolve(
  __dirname,
  '../../../test-file-upload-data/test-image.png',
);
const jpgFilePath = path.resolve(
  __dirname,
  '../../../test-file-upload-data/test-photo.jpg',
);
const changedFileNames = [
  'Renamed PDF file',
  'Renamed Document file',
  'Renamed PNG file',
  'Renamed JPG file',
];
const testFilePaths = [pdfFilePath, docxFilePath, pngFilePath, jpgFilePath];
const fileTypesNames = ['PDF', 'Document', 'Image', 'Image'];
// Get file name from file path for validation
const getFileName = (filePath: string) =>
  `Test ${path.basename(filePath, path.extname(filePath)).toUpperCase()} file upload`;

// Arrange
test.describe('Rename attachments on Program Level', () => {
  test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
    // reset
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      skipSeedRegistrations: true,
      navigateToPage: `/program/${programIdOCW}/monitoring/files`,
    });
    accessToken = await getAccessToken();
    // seed with attachments
    for (const filePath of testFilePaths) {
      await uploadAttachment({
        programId: programIdOCW,
        filePath,
        filename: getFileName(filePath),
        accessToken,
      });
    }
  });

  test('Rename: Word, PDF, JPG and PNG attachments formats', async ({
    page,
    tableComponent,
    programMonitoringPage,
  }) => {
    await test.step('Validate uploaded files', async () => {
      await tableComponent.validateWaitForTableRowCount({
        expectedRowCount: 4,
      });
      const fileNamesArray = await tableComponent.getTextArrayFromColumn(2); // Column 2 is the 'Name' column
      const fileTypesArray = await tableComponent.getTextArrayFromColumn(1); // Column 1 is the 'Type' column
      for (const [i, filePath] of testFilePaths.entries()) {
        const expectedFileName = getFileName(filePath);
        expect(fileNamesArray[i]).toContain(expectedFileName);
        expect(fileTypesArray[i]).toContain(fileTypesNames[i]);
      }
    });

    await test.step('Rename attachments', async () => {
      for (const [i, filePath] of testFilePaths.entries()) {
        const newFileName = changedFileNames[i];
        await programMonitoringPage.updateAttachmentName({
          fileName: getFileName(filePath),
          newFileName,
        });
      }
    });

    await test.step('Validate renamed files', async () => {
      // Wait for the last file name to be updated in the table before fetching the file names array for validation
      await page.getByText('Renamed JPG file').waitFor({ state: 'visible' });
      const fileNamesArray = await tableComponent.getTextArrayFromColumn(2); // Column 2 is the 'Name' column

      for (const [i, expectedFileName] of changedFileNames.entries()) {
        expect(fileNamesArray[i]).toContain(expectedFileName);
      }
    });
  });
});
