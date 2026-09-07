import { expect } from '@playwright/test';

import { CurrencyCode } from '@121-service/src/exchange-rates/enums/currency-code.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import CreateProgramDialog from '@121-e2e/portal/components/CreateProgramDialog';
import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import { getFspLabels } from '@121-e2e/portal/helpers/get-fsp-labels';

const todayDate = new Date();
const futureDate = new Date(todayDate);
futureDate.setDate(futureDate.getDate() + 1);

const programData = {
  name: 'TUiR Warta',
  description: 'TUiR Warta description',
  dateRange: { start: todayDate, end: futureDate },
  location: 'Polen',
  targetRegistrations: '200',
  fundsAvailable: '200',
  currency: CurrencyCode.CAD,
  paymentFrequency: '2-months',
  defaultNumberOfTransactions: '5',
  fixedTransferValue: '100',
  fsps: getFspLabels({
    fsps: [Fsps.intersolveVisa, Fsps.intersolveVoucherPaper, Fsps.safaricom],
  }),
};

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ onlyResetAndSeedRegistrations }) => {
  await onlyResetAndSeedRegistrations({
    seedScript: SeedScript.testMultiple,
  });
});

test.beforeEach(async ({ loginPage }) => {
  await loginPage.loginAsAdmin();
});

test('Create program successfully', async ({
  programSettingsPage,
  programOverviewPage,
  page,
}) => {
  const createProgramDialog = new CreateProgramDialog(page);
  // Act
  await test.step('Should display correct program details in settings page', async () => {
    await test.step('Should navigate to main page and select "Create new program" button and fill in the form', async () => {
      await programOverviewPage.openCreateNewProgram();
      await expect(page.getByText('Step 1 of 3')).toBeVisible();
      await createProgramDialog.fillInStep1(programData);
      await expect(page.getByText('Step 2 of 3')).toBeVisible();
      await createProgramDialog.fillInStep2(programData);
      await expect(page.getByText('Step 3 of 3')).toBeVisible();
      await createProgramDialog.fillInStep3(programData);
      const newProgramId = 3; // Id of newly created program based on SeedScript.testMultiple
      await page.waitForURL((url) =>
        url.pathname.startsWith(`/en-GB/program/${newProgramId}/settings`),
      );
      await programOverviewPage.validateToastMessageAndClose(
        'Program successfully created.',
      );
    });
  });

  await test.step('Should display correct program details in settings page', async () => {
    await programSettingsPage.validateProgramDetails({ programData });
  });
});

test('Duplicate program successfully', async ({
  programOverviewPage,
  programSettingsPage,
  page,
}) => {
  const createProgramDialog = new CreateProgramDialog(page);
  // Act
  await test.step('Duplicate the program', async () => {
    await programOverviewPage.goto('/programs');
    await programOverviewPage.clickDuplicateProgram({
      programName: programData.name,
    });
    await createProgramDialog.createDuplicateProgramWithNewName({
      name: 'Duplicate Program',
    });
    const newProgramId = 4;
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${newProgramId}/settings`),
    );
    await programOverviewPage.validateToastMessageAndClose(
      'Program successfully duplicated.',
    );
  });

  // Assert
  await test.step('Should display correct program details in settings page', async () => {
    await programSettingsPage.validateProgramDetails({
      programData,
      programName: 'Duplicate Program',
    });
  });
});

test('Create program validation checks on each step', async ({
  page,
  programOverviewPage,
}) => {
  const createProgramDialog = new CreateProgramDialog(page);

  // Act
  await test.step('Should navigate to main page and select "Create new program" button', async () => {
    await programOverviewPage.openCreateNewProgram();
  });

  await test.step('Should attempt to proceed without filling in step 1', async () => {
    await createProgramDialog.nextButton.click();
    await programOverviewPage.validateToastMessageAndClose(
      'Please correct the errors in the form.',
    );
    // Program name is mandatory
    await expect(page.getByText('This field is required')).toBeVisible();
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
  });

  await test.step('Should successfully fill in step 1 and proceed', async () => {
    await createProgramDialog.fillInStep1(programData);
  });

  await test.step('Should attempt to proceed without filling in step 2', async () => {
    await createProgramDialog.nextButton.click();
    await programOverviewPage.validateToastMessageAndClose(
      'Please correct the errors in the form.',
    );
    // Target registrations has a minimum value of 1
    await expect(
      page.getByText('This field needs to be at least 1.'),
    ).toBeVisible();
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
  });

  await test.step('Should successfully fill in step 2 and proceed', async () => {
    await createProgramDialog.fillInStep2(programData);
  });

  await test.step('Should successfully proceed without filling in step 3', async () => {
    await createProgramDialog.submitButton.click();
    await programOverviewPage.validateToastMessageAndClose(
      'Program successfully created.',
    );
  });
});
