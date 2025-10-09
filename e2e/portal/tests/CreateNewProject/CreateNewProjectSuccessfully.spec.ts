import { test } from '@playwright/test';
import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import CreateProjectDialog from '@121-e2e/portal/components/CreateProjectDialog';
import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectSettingsPage from '@121-e2e/portal/pages/ProjectSettingsPage';

const todaysDate = new Date();
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 1);

// XXX: add test for failing on step 1, 2, 3
test('[29635] Create project successfully', async ({ page }) => {
  // Arrange
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();

  // The above test-preparation (resetDB + login) is done AFTER the skip-check, to prevent unnecessary time-consuming operations in CI.

  const homePage = new HomePage(page);
  const createProjectDialog = new CreateProjectDialog(page);
  const projectSettings = new ProjectSettingsPage(page);

  const projectInfo = {
    name: 'TUiR Warta',
    description: 'TUiR Warta description',
    dateRange: { start: todaysDate, end: futureDate },
    location: 'Polen',
    targetRegistrations: '200',
    fundsAvailable: '200',
    currency: 'USD',
    paymentFrequency: '2-months',
    defaultTransferAmount: '200',
    fixedTransferValue: '100',
  };

  // Act
  await test.step('Should navigate to main page and select "Create new project" button and fill in the form', async () => {
    await homePage.openCreateNewProject();
    await createProjectDialog.fillInStep1(projectInfo);
    await createProjectDialog.fillInStep2(projectInfo);
    await createProjectDialog.fillInStep3(projectInfo);
    await page.waitForURL((url) =>
      url.pathname.startsWith('/en-GB/project/2/settings'),
    );
    await homePage.validateToastMessage('Project successfully created.');
  });

  await test.step('Should display correct project details in settings page', async () => {
    const basicInformationData =
      await projectSettings.basicInformationDataList.getData();
    expect(basicInformationData).toEqual({
      '*Project name': projectInfo.name,
      'Project description': projectInfo.description,
      'Start date': format(projectInfo.dateRange.start, 'dd MMMM yyyy'),
      'End date': format(projectInfo.dateRange.end, 'dd MMMM yyyy'),
      Location: projectInfo.location,
      '*Target registrations': projectInfo.targetRegistrations,
      'Enable validation': 'No',
      'Enable scope': 'No',
    });

    const budgetData = await projectSettings.budgetDataList.getData();
    expect(budgetData).toEqual({
      'Funds available': projectInfo.fundsAvailable,
      '*Currency': projectInfo.currency,
      'Payment frequency': projectInfo.paymentFrequency,
      'Default transfers per registration': projectInfo.defaultTransferAmount,
      '*Fixed transfer value': projectInfo.fixedTransferValue,
    });
  });
});
