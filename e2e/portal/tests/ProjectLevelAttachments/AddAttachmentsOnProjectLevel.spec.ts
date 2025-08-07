import { expect, Page, test } from '@playwright/test';
import path from 'path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import TableComponent from '@121-e2e/portal/components/TableComponent';
// import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectMonitoring from '@121-e2e/portal/pages/ProjectMonitoringPage';

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
const fileTypesNames = ['PDF', 'Document', 'Image', 'Image'];

// Arrange
test.describe('Attachments on Project Level', () => {
  let page: Page;
  const projectTitle = 'NLRC OCW Program';

  test.beforeAll(async ({ browser }) => {
    await resetDB(SeedScript.nlrcMultiple, __filename);

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
  });

  test('[37582] Upload: Word, PDF, JPG and PNG attachments formats', async () => {
    const projectMonitoring = new ProjectMonitoring(page);
    const tableComponent = new TableComponent(page);

    await test.step('Select file tab', async () => {
      await projectMonitoring.selectTab({ tabName: 'Files' });
    });

    await test.step('Upload files', async () => {
      for (const filePath of testFilePaths) {
        await projectMonitoring.uploadAttachment({
          filePath,
          reason: `Test ${path.basename(filePath, path.extname(filePath)).toUpperCase()} file upload`,
        });
      }
    });

    await test.step('Validate uploaded files', async () => {
      await page.waitForTimeout(200); // Wait for last file to be present in the table

      await tableComponent.validateTableRowCount(4);
      const fileNamesArray = await tableComponent.getTextArrayFromColumn(2); // Column 2 is the 'Name' column
      const fileTypesArray = await tableComponent.getTextArrayFromColumn(1); // Column 1 is the 'Type' column
      for (let i = 0; i < testFilePaths.length; i++) {
        const expectedFileName = `Test ${path.basename(testFilePaths[i], path.extname(testFilePaths[i])).toUpperCase()} file upload`;
        expect(fileNamesArray[i]).toContain(expectedFileName);
        expect(fileTypesArray[i]).toContain(fileTypesNames[i]);
      }
    });
  });
});
