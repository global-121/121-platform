import { expect, Page, test } from '@playwright/test';
import path from 'path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { uploadAttachment } from '@121-service/test/helpers/program-attachments.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectMonitoring from '@121-e2e/portal/pages/ProjectMonitoringPage';

let accessToken: string;
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
test.describe('Attachments on Project Level', () => {
  let page: Page;
  const projectTitle = 'NLRC OCW Program';

  test.beforeAll(async ({ browser }) => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    accessToken = await getAccessToken();

    for (const filePath of testFilePaths) {
      const baseName = path.basename(filePath);
      fileNames.push(baseName);
      await uploadAttachment({
        programId: 3,
        filePath,
        filename: baseName,
        accessToken,
      });
    }

    page = await browser.newPage();
    // Login
    const loginPage = new LoginPage(page);
    await page.goto('/');
    await loginPage.login();
  });

  test.beforeEach(async () => {
    const projectMonitoring = new ProjectMonitoring(page);

    await page.goto('/');
    await projectMonitoring.selectProgram(projectTitle);
    await projectMonitoring.navigateToProgramPage('Monitoring');
    await projectMonitoring.selectTab({ tabName: 'Files' });
  });

  test('Delete Attachment', async () => {
    const projectMonitoring = new ProjectMonitoring(page);
    const tableComponent = new TableComponent(page);

    await test.step('Delete attachment', async () => {
      await projectMonitoring.deleteAttachmentByName({
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
