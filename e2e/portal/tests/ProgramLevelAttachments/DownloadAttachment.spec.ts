import { Page, test } from '@playwright/test';
import path from 'path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { uploadAttachment } from '@121-service/test/helpers/program-attachments.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProgramMonitoring from '@121-e2e/portal/pages/ProgramMonitoringPage';

let accessToken: string;
const pdfFilePath = path.resolve(
  __dirname,
  '../../../test-file-upload-data/test-document.pdf',
);
const fileName = 'Test TEST-DOCUMENT file upload.pdf';

// Arrange
test.describe('Attachments on Program Level', () => {
  let page: Page;
  const programTitle = 'NLRC OCW Program';

  test.beforeAll(async ({ browser }) => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    await uploadAttachment({
      programId: 3,
      filePath: pdfFilePath,
      filename: fileName,
      accessToken,
    });
    page = await browser.newPage();
    // Login
    const loginPage = new LoginPage(page);
    await page.goto('/');
    await loginPage.login();
  });

  test.beforeEach(async () => {
    const programMonitoring = new ProgramMonitoring(page);

    await page.goto('/');
    await programMonitoring.selectProgram(programTitle);
    await programMonitoring.navigateToProgramPage('Monitoring');
    await programMonitoring.selectTab({ tabName: 'Files' });
  });

  test('Download Attachment', async () => {
    const programMonitoring = new ProgramMonitoring(page);

    await test.step('Download and validate attachment', async () => {
      await programMonitoring.downloadAttachmentByName({
        fileName,
        snapshotName: 'Test-TEST-DOCUMENT-file-upload.pdf',
      });
    });
  });
});
