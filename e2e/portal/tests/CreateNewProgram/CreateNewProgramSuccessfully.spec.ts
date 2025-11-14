import { expect, test } from '@playwright/test';
import { format } from 'date-fns';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import CreateProgramDialog from '@121-e2e/portal/components/CreateProgramDialog';
import HomePage from '@121-e2e/portal/pages/HomePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProgramSettingsPage from '@121-e2e/portal/pages/ProgramSettingsPage';

const todaysDate = new Date();
const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 1);

const programInfo = {
  name: 'TUiR Warta',
  description: 'TUiR Warta description',
  dateRange: { start: todaysDate, end: futureDate },
  location: 'Polen',
  targetRegistrations: '200',
  fundsAvailable: '200',
  currency: CurrencyCode.CAD,
  paymentFrequency: '2-months',
  defaultNrOfTransactions: '5',
  fixedTransferValue: '100',
};

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.testMultiple, __filename);

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('Create program successfully', async ({ page }) => {
  const homePage = new HomePage(page);
  const createProgramDialog = new CreateProgramDialog(page);
  const programSettings = new ProgramSettingsPage(page);

  // Act
  await test.step('Should navigate to main page and select "Create new program" button and fill in the form', async () => {
    await homePage.openCreateNewProgram();
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
    await createProgramDialog.fillInStep1(programInfo);
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
    await createProgramDialog.fillInStep2(programInfo);
    await expect(page.getByText('Step 3 of 3')).toBeVisible();
    await createProgramDialog.fillInStep3(programInfo);
    const newProgramId = 3; // Id of newly created program based on SeedScript.testMultiple
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${newProgramId}/settings`),
    );
    await homePage.validateToastMessage('Program successfully created.');
  });

  await test.step('Should display correct program details in settings page', async () => {
    const basicInformationData =
      await programSettings.basicInformationDataList.getData();
    expect(basicInformationData).toEqual({
      '*Program name': programInfo.name,
      'Program description': programInfo.description,
      'Start date': format(programInfo.dateRange.start, 'd MMMM yyyy'),
      'End date': format(programInfo.dateRange.end, 'd MMMM yyyy'),
      Location: programInfo.location,
      '*Target registrations': programInfo.targetRegistrations,
      'Enable validation': 'No',
      'Enable scope': 'No',
    });

    const budgetData = await programSettings.budgetDataList.getData();
    expect(budgetData).toEqual({
      'Funds available': programInfo.fundsAvailable,
      '*Currency': programInfo.currency,
      'Default transactions per registration':
        programInfo.defaultNrOfTransactions,
      '*Fixed transfer value': programInfo.fixedTransferValue,
    });
  });
});

test('Create program validation checks on each step', async ({ page }) => {
  const homePage = new HomePage(page);
  const createProgramDialog = new CreateProgramDialog(page);

  // Act
  await test.step('Should navigate to main page and select "Create new program" button', async () => {
    await homePage.openCreateNewProgram();
  });

  await test.step('Should attempt to proceed without filling in step 1', async () => {
    await createProgramDialog.nextButton.click();
    await homePage.validateToastMessageAndClose(
      'Please correct the errors in the form.',
    );
    // Program name is mandatory
    await expect(page.getByText('This field is required')).toBeVisible();
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
  });

  await test.step('Should successfully fill in step 1 and proceed', async () => {
    await createProgramDialog.fillInStep1(programInfo);
  });

  await test.step('Should attempt to proceed without filling in step 2', async () => {
    await createProgramDialog.nextButton.click();
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
    await createProgramDialog.fillInStep2(programInfo);
  });

  await test.step('Should successfully proceed without filling in step 3', async () => {
    // No mandatory fields on step 3, so should be able to proceed
    await createProgramDialog.submitButton.click();
    await homePage.validateToastMessage('Program successfully created.');
  });
});
