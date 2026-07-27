import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { resetDB } from '@121-service/test/helpers/utility.helper';

import CreateProgramDialog from '@121-e2e/portal/components/CreateProgramDialog';
import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import { getProgramData } from './program-data';

const programData = getProgramData();

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
    await createProgramDialog.fillInStep1(programData);
    await createProgramDialog.fillInStep2(programData);
    await createProgramDialog.fillInStep3(programData);
    const newProgramId = 3; // Id of newly created program based on SeedScript.testMultiple
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${newProgramId}/settings`),
    );
    await homePage.validateToastMessage('Program successfully created.');
  });

  // Act
  await test.step('Duplicate the program', async () => {
    await homePage.goto('/programs');
    await homePage.clickDuplicateProgram({ programName: programData.name });
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
      programData,
      programName: 'Duplicate Program',
    });
  });
});
