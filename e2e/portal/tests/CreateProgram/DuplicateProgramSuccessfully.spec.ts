import { expect } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import CreateProgramDialog from '@121-e2e/portal/components/CreateProgramDialog';
import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import { createProgramInfo } from './create-program-data';

const programInfo = createProgramInfo();

test.beforeEach(async ({ loginPage }) => {
  await resetDB({
    seedScript: SeedScript.testMultiple,
  });

  // Login
  await loginPage.loginAsAdmin();
});

test('Duplicate program successfully', async ({
  homePage,
  page,
  programSettingsPage,
}) => {
  const createProgramDialog = new CreateProgramDialog(page);

  // Prepare
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

  // Act
  await test.step('Duplicate the program', async () => {
    await page.goto('/en-GB/programs');
    await homePage.clickDuplicateProgram({ programName: programInfo.name });
    await createProgramDialog.createDuplicateProgramWithNewName({
      name: 'Duplicate Program',
    });
    const newProgramId = 4; // Id of newly created program based on SeedScript.testMultiple
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${newProgramId}/settings`),
    );
    await homePage.validateToastMessage('Program successfully duplicated.');
  });

  // Assert
  await test.step('Should display correct program details in settings page', async () => {
    await programSettingsPage.validateProgramDetails({
      programInfo,
      programName: 'Duplicate Program',
    });
  });
});
