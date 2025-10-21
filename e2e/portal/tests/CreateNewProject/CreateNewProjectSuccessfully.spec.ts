import { expect, test } from '@playwright/test';
import { format } from 'date-fns';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import CreateProjectDialog from '@121-e2e/portal/components/CreateProjectDialog';
import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectSettingsPage from '@121-e2e/portal/pages/ProjectSettingsPage';

const todaysDate = new Date();
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 1);

const projectInfo = {
  name: 'TUiR Warta',
  description: 'TUiR Warta description',
  dateRange: { start: todaysDate, end: futureDate },
  location: 'Polen',
  targetRegistrations: '200',
  fundsAvailable: '200',
  currency: CurrencyCode.CAD,
  paymentFrequency: '2-months',
  defaultTransferAmount: '200',
  fixedTransferValue: '100',
};

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[29635] Create project successfully', async ({ page }) => {
  const homePage = new HomePage(page);
  const createProjectDialog = new CreateProjectDialog(page);
  const projectSettings = new ProjectSettingsPage(page);

  // Act
  await test.step('Should navigate to main page and select "Create new project" button and fill in the form', async () => {
    await homePage.openCreateNewProject();
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
    await createProjectDialog.fillInStep1(projectInfo);
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
    await createProjectDialog.fillInStep2(projectInfo);
    await expect(page.getByText('Step 3 of 3')).toBeVisible();
    await createProjectDialog.fillInStep3(projectInfo);
    const newProjectId = 3; // Id of newly created project based on SeedScript.testMultiple
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/project/${newProjectId}/settings`),
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
      'Default transfers per registration': projectInfo.defaultTransferAmount,
      '*Fixed transfer value': projectInfo.fixedTransferValue,
    });
  });
});

test('Create project validation checks on each step', async ({ page }) => {
  const homePage = new HomePage(page);
  const createProjectDialog = new CreateProjectDialog(page);

  // Act
  await test.step('Should navigate to main page and select "Create new project" button', async () => {
    await homePage.openCreateNewProject();
  });

  await test.step('Should attempt to proceed without filling in step 1', async () => {
    await createProjectDialog.nextButton.click();
    await homePage.validateToastMessageAndClose(
      'Please correct the errors in the form.',
    );
    // Project name is mandatory
    await expect(page.getByText('This field is required')).toBeVisible();
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
  });

  await test.step('Should successfully fill in step 1 and proceed', async () => {
    await createProjectDialog.fillInStep1(projectInfo);
  });

  await test.step('Should attempt to proceed without filling in step 2', async () => {
    await createProjectDialog.nextButton.click();
    await homePage.validateToastMessageAndClose(
      'Please correct the errors in the form.',
    );
    // Target registrations has a minimum value of 1
    await expect(
      page.getByText('This field needs to be at least 1.'),
    ).toBeVisible();
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
  });

  await test.step('Should successfully fill in step 2 and proceed', async () => {
    await createProjectDialog.fillInStep2(projectInfo);
  });

  await test.step('Should successfully proceed without filling in step 3', async () => {
    // No mandatory fields on step 3, so should be able to proceed
    await createProjectDialog.submitButton.click();
    await homePage.validateToastMessage('Project successfully created.');
  });
});
