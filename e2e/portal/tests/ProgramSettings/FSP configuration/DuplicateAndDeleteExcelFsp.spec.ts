import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import CreateProgramDialog from '@121-e2e/portal/components/CreateProgramDialog';
import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import { getProgramData } from '../../CreateProgram/program-data';

const programData = getProgramData({ fsps: [Fsps.excel] });

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

  await test.step('Should navigate to main page and select "Create new program" button and fill in the form', async () => {
    await homePage.openCreateNewProgram();
    await createProgramDialog.fillInStep1(programData);
    await createProgramDialog.fillInStep2(programData);
    await createProgramDialog.fillInStep3(programData);
    const newProgramId = 1; // Id of newly created program based on SeedScript.productionInitialState
    await page.waitForURL((url) =>
      url.pathname.startsWith(`/en-GB/program/${newProgramId}/settings`),
    );
    await homePage.validateToastMessage('Program successfully created.');
  });

  await test.step('Validate that user is warned on having a unconfigured FSP', async () => {
    await fspSettingsPage.clickFspIntegration();
    await fspSettingsPage.validateFspVisibility({
      fspNames: ['Excel Payment Instructions'],
      integrated: false,
    });
    await fspSettingsPage.validateUnconfiguredFspWarningVisibility();
  });

  await test.step('Integrate Excel FSP by finishing configuration', async () => {
    await fspSettingsPage.clickIntegrateButtonForFsp({
      fspDisplayName: 'Excel Payment Instructions',
    });
    await fspSettingsPage.configureExcelFsp({});
    await fspSettingsPage.saveReconfigurationButton.click();
    await fspSettingsPage.validateToastMessage(
      'Success FSP "Excel Payment Instructions" integrated successfully.',
    );
  });

  await test.step('Duplicate the FSP', async () => {
    await fspSettingsPage.clickOptionInFspDropdownMenu({
      fspName: Fsps.excel,
      optionLabel: 'Create another Excel FSP',
    });
    await fspSettingsPage.configureExcelFsp({
      withName: 'Excel Payment Instructions 2',
    });
    await fspSettingsPage.integrateFspButton.click();
    await fspSettingsPage.validateToastMessage(
      'Success FSP "Excel Payment Instructions 2" integrated successfully.',
    );
    await fspSettingsPage.validateProgramFspCards({
      fspNames: ['Excel Payment Instructions', 'Excel Payment Instructions 2'],
    });
  });

  await test.step('Delete the duplicated program', async () => {
    await fspSettingsPage.deleteFsp({
      fspNames: ['Excel Payment Instructions 2'],
    });
    await fspSettingsPage.validateProgramFspCards({
      fspNames: ['Excel Payment Instructions'],
    });
    await fspSettingsPage.validateFspOptionVisibility({
      fspName: 'Excel Payment Instructions',
      optionLabel: 'Remove integration',
      visible: false,
    });
  });
});
