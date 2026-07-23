import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import CreateProgramDialog from '@121-e2e/portal/components/CreateProgramDialog';
import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import { createProgramInfo } from '../../CreateProgram/create-program-data';

const programInfo = createProgramInfo({ fsps: [Fsps.excel] });

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.productionInitialState,
    skipSeedRegistrations: true,
  });
});

test('Duplicate and delete Excel FSP', async ({
  homePage,
  page,
  fspSettingsPage,
}) => {
  const createProgramDialog = new CreateProgramDialog(page);

  // Prepare
  await test.step('Should navigate to main page and select "Create new program" button and fill in the form', async () => {
    await homePage.openCreateNewProgram();
    await createProgramDialog.fillInStep1(programInfo);
    await createProgramDialog.fillInStep2(programInfo);
    await createProgramDialog.fillInStep3(programInfo);
    const newProgramId = 1; // Id of newly created program based on SeedScript.productionInitialState
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${newProgramId}/settings`),
    );
    await homePage.validateToastMessage('Program successfully created.');
  });

  // Assert
  await test.step('Validate that user is warned on having a unconfigured FSP', async () => {
    await fspSettingsPage.clickFspIntegration();
    await fspSettingsPage.validateFspVisibility({
      fspNames: [Fsps.excel],
      integrated: false,
    });
    await fspSettingsPage.validateUnconfiguredFspWarningVisibility();
  });

  // Act
  await test.step('Integrate Excel FSP by finishing configuration', async () => {
    await fspSettingsPage.configureExcelFsp();
    await fspSettingsPage.validateToastMessage(
      'FSP "Excel Payment Instructions" integrated successfully.',
    );
  });
});
