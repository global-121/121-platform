import { expect } from '@playwright/test';
import path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { uploadAttachment } from '@121-service/test/helpers/program-attachments.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const pdfFilePath = path.resolve(
  __dirname,
  '../../../test-file-upload-data/test-document.pdf',
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
const testFilePaths = [pdfFilePath, docxFilePath, pngFilePath, jpgFilePath];
let fileNames: string[] = [];
const fileNameToDelete = 'test-document.docx';

// Arrange
test.describe('Attachments on Program Level', () => {
  test.beforeEach(async ({ resetDBAndSeedRegistrations, accessToken }) => {
    await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      skipSeedRegistrations: true,
      navigateToPage: `/program/${programIdOCW}/monitoring/files`,
    });

    for (const filePath of testFilePaths) {
      const baseName = path.basename(filePath);
      fileNames.push(baseName);
      await uploadAttachment({
        programId: programIdOCW,
        filePath,
        filename: baseName,
        accessToken,
      });
    }
  });

  test('Delete Attachment', async ({
    page,
    programMonitoringPage,
    tableComponent,
  }) => {
    await test.step('Delete attachment', async () => {
      await programMonitoringPage.deleteAttachmentByName({
        fileName: fileNameToDelete,
      });
      fileNames = fileNames.filter((name) => name !== fileNameToDelete);
    });

    await test.step('Validate attachment deletion', async () => {
      await page.waitForTimeout(200); // Wait for the deletion to be processed and table fully updated

      await tableComponent.validateWaitForTableRowCount({
        expectedRowCount: 3,
      }); // 4 files - 1 deleted = 3 remaining
      let fileNamesArray = await tableComponent.getTextArrayFromColumn(2); // Column 2 is the 'Name' column
      // Remove double extensions if present
      fileNamesArray = fileNamesArray.map((name) =>
        name.replace(/(\.\w+)\1$/, '$1'),
      );
      expect(fileNamesArray.sort()).toEqual(fileNames.sort());
    });
  });
});
