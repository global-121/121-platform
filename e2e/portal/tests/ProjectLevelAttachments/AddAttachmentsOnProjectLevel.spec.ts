import { Page, test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

// import ExportData from '@121-e2e/portal/components/ExportData';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectMonitoring from '@121-e2e/portal/pages/ProjectMonitoringPage';

// Arrange
test.describe('Export Payments with Date Range', () => {
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

    await test.step('Select file tab', async () => {
      await projectMonitoring.selectTab({ tabName: 'Files' });
    });

    await test.step('Upload files', async () => {
      console.log('Uploading files is not implemented in this test.');
    });

    await test.step('Validate uploaded files', async () => {
      console.log('Validating uploaded files is not implemented in this test.');
    });
  });
});
