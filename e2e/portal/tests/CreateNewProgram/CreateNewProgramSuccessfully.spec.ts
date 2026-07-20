import { expect } from '@playwright/test';
import { format } from 'date-fns';

import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import CreateProgramDialog from '@121-e2e/portal/components/CreateProgramDialog';
import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import LoginPage from '@121-e2e/portal/pages/LoginPage';

import { getProgramInfo } from './program-info.helper';

test.beforeEach(async ({ page }) => {
  await resetDB({
    seedScript: SeedScript.testMultiple,
  });

  // Login
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();
});

const programInfo = getProgramInfo({
  fsps: [
    FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
    FSP_SETTINGS[Fsps.safaricom].defaultLabel.en,
    FSP_SETTINGS[Fsps.intersolveVoucherPaper].defaultLabel.en,
  ] as string[],
});

test('Create program successfully', async ({
  programSettingsPage,
  homePage,
  page,
}) => {
  const createProgramDialog = new CreateProgramDialog(page);
  // Act
  await test.step('Should navigate to main page and select "Create new program" button and fill in the form', async () => {
    await homePage.openCreateNewProgram();
    await createProgramDialog.createProgram({
      programInfo,
      navigateToSettingsPageWithId: 3,
    });
    await homePage.validateToastMessage('Program successfully created.');
  });

  await test.step('Should display correct program details in settings page', async () => {
    const basicInformationData =
      await programSettingsPage.basicInformationDataList.getData();
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

    const budgetData = await programSettingsPage.budgetDataList.getData({
      omitListItemWithLabel: '*Financial service providers',
    });

    expect(budgetData).toEqual({
      'Funds available': programInfo.fundsAvailable,
      '*Currency': programInfo.currency,
      'Default transactions per registration':
        programInfo.defaultNrOfTransactions,
      '*Fixed transfer value': programInfo.fixedTransferValue,
    });

    // Validating the FSPs in the multiselect component separately, as the dataListData returns a concatenated string of the FSPs
    if (programInfo.fsps) {
      await programSettingsPage.validateProgramFspsPills({
        fspNames: programInfo.fsps,
      });
    }
  });
});

test('Create program validation checks on each step', async ({
  page,
  homePage,
}) => {
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
