import { expect, Page, test } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import TableComponent from '@121-e2e/portal/components/TableComponent';
import { generateLargeTestFile } from '@121-e2e/portal/helpers/largeFileGenerator';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProgramMonitoring from '@121-e2e/portal/pages/ProgramMonitoringPage';

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
const wrongFileFormatPath = path.resolve(
  __dirname,
  '../../../test-file-upload-data/wrong-file-format.pages',
);
let largeFilePath: string;
const testFilePaths = [pdfFilePath, docxFilePath, pngFilePath, jpgFilePath];
const fileTypesNames = ['PDF', 'Document', 'Image', 'Image'];
// Get file name from file path for validation
const getFileName = (filePath: string) =>
  `Test ${path.basename(filePath, path.extname(filePath)).toUpperCase()} file upload`;

// Arrange
test.describe('Attachments on Program Level', () => {
  let page: Page;
  const programTitle = 'NLRC OCW Program';

  test.beforeAll(async ({ browser }) => {
    await resetDB(SeedScript.nlrcMultiple, __filename);
    // Generate the large file in the OS temp directory
    largeFilePath = path.join(os.tmpdir(), 'large-test-file.pdf');
    await generateLargeTestFile(largeFilePath, 105 * 1024 * 1024); // 105MB

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

  test('Upload: Word, PDF, JPG and PNG attachments formats', async () => {
    const programMonitoring = new ProgramMonitoring(page);
    const tableComponent = new TableComponent(page);

    await test.step('Upload files', async () => {
      for (const filePath of testFilePaths) {
        await programMonitoring.uploadAttachment({
          filePath,
          filename: `Test ${path.basename(filePath, path.extname(filePath)).toUpperCase()} file upload`,
        });
      }
    });

    await test.step('Validate uploaded files', async () => {
      await page.waitForTimeout(200); // Wait for last file to be present in the table

      await tableComponent.validateWaitForTableRowCount({
        expectedRowCount: 4,
      });
      const fileNamesArray = await tableComponent.getTextArrayFromColumn(2); // Column 2 is the 'Name' column
      const fileTypesArray = await tableComponent.getTextArrayFromColumn(1); // Column 1 is the 'Type' column
      for (let i = 0; i < testFilePaths.length; i++) {
        const expectedFileName = getFileName(testFilePaths[i]);
        expect(fileNamesArray[i]).toContain(expectedFileName);
        expect(fileTypesArray[i]).toContain(fileTypesNames[i]);
      }
    });
  });

  test('Error when uploading not accepted format', async () => {
    const programMonitoring = new ProgramMonitoring(page);

    await test.step('Upload file with unsupported format', async () => {
      await programMonitoring.uploadAttachment({
        filePath: wrongFileFormatPath,
        filename: `Test ${path.basename(wrongFileFormatPath, path.extname(wrongFileFormatPath)).toUpperCase()} file upload`,
      });
    });

    await test.step('Validate wrong file format error message', async () => {
      await programMonitoring.validateFormError({
        errorText:
          'Something went wrong: "Validation failed (invalid file type)"',
      });
    });
  });

  test('Error when uploading file bigger than 100mb', async () => {
    const programMonitoring = new ProgramMonitoring(page);

    await test.step('Upload file bigger than 100mb', async () => {
      await programMonitoring.uploadAttachment({
        filePath: largeFilePath,
        filename: `Test ${path.basename(largeFilePath, path.extname(largeFilePath)).toUpperCase()} file upload`,
      });
    });

    await test.step('Validate file size error message', async () => {
      await programMonitoring.validateFormError({
        errorText:
          'Something went wrong: "Validation failed (current file size is 110100480, expected size is less than 100000000)"',
      });
    });
  });
});
