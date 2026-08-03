import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    skipSeedRegistrations: true,
  });
});

test('Duplicate and delete Excel FSP', async ({
  fspSettingsPage,
  programSettingsPage,
  programOverviewPage,
  registrationsPage,
}) => {
  await test.step('Remove Safaricom FSP and add Excel FSP', async () => {
    await programOverviewPage.selectProgram('Safaricom Program');
    await registrationsPage.navigateToProgramPage('Settings');
    await programSettingsPage.changeFspSelectionForProgram({
      fspNames: [Fsps.safaricom, Fsps.excel],
    });
  });

  await test.step('Validate that user is warned on having an unconfigured FSP', async () => {
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

  await test.step('Delete the duplicated FSP', async () => {
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
