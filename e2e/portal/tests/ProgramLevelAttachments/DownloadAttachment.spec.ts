import path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { uploadAttachment } from '@121-service/test/helpers/program-attachments.helper';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const pdfFilePath = path.resolve(
  __dirname,
  '../../../test-file-upload-data/test-document.pdf',
);
const fileName = 'Test TEST-DOCUMENT file upload.pdf';

// Arrange
test.describe('Attachments on Program Level', () => {
  test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
    const { accessToken } = await resetDBAndSeedRegistrations({
      seedScript: SeedScript.nlrcMultiple,
      skipSeedRegistrations: true,
      navigateToPage: `en-GB/program/${programIdOCW}/monitoring/files`,
    });

    await uploadAttachment({
      programId: programIdOCW,
      filePath: pdfFilePath,
      filename: fileName,
      accessToken,
    });
  });

  test('Download Attachment', async ({ programMonitoringPage }) => {
    await test.step('Download and validate attachment', async () => {
      await programMonitoringPage.downloadAttachmentByName({
        fileName,
        snapshotName: 'Test-TEST-DOCUMENT-file-upload.pdf',
      });
    });
  });
});
