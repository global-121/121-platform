import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

import { getFspLabels } from './get-fsp-labels.helper';

// Get program info without FSP's

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.safaricomProgram,
    programId: programIdSafaricom,
    navigateToPage: `/program/${programIdSafaricom}/settings`,
    skipSeedRegistrations: true,
  });
});

const allFsps = getFspLabels({
  fsps: [
    Fsps.excel,
    Fsps.intersolveVisa,
    Fsps.intersolveVoucherWhatsapp,
    Fsps.intersolveVoucherPaper,
    Fsps.safaricom,
    Fsps.airtel,
    Fsps.commercialBankEthiopia,
    Fsps.nedbank,
    Fsps.onafriq,
    Fsps.cooperativeBankOfOromia,
    // Fsps.mtn,
  ],
});

test('Add all available FSPs via the budget page', async ({
  fspSettingsPage,
  programSettingsPage,
}) => {
  await test.step('Remove Safaricom FSP', async () => {
    await programSettingsPage.clickEditProgramInformationSectionByTitle(
      'Budget',
    );
    await programSettingsPage.selectMultiselectOptions({
      dropdownTestId: 'fsp-multiselect',
      optionsToClick: [FSP_SETTINGS[Fsps.safaricom].defaultLabel.en!],
    });

    await programSettingsPage.saveChanges();
    await programSettingsPage.validateToastMessageAndClose(
      'Budget details saved successfully.',
    );
  });

  await test.step('Add all available FSPs', async () => {
    await programSettingsPage.clickEditProgramInformationSectionByTitle(
      'Budget',
    );
    await programSettingsPage.selectMultiselectOptions({
      dropdownTestId: 'fsp-multiselect',
      optionsToClick: allFsps,
    });

    await programSettingsPage.saveChanges();
    await programSettingsPage.validateToastMessageAndClose(
      'Budget details saved successfully.',
    );
  });

  // Assert
  await test.step('Validate that all FSPs are added on the budget page', async () => {
    await programSettingsPage.validateProgramFsps({
      fspNames: allFsps,
    });
  });

  await test.step('Validate only assigned FSPs are visible at first', async () => {
    await fspSettingsPage.validateFspVisibility({ fspNames: allFsps });
  });
});
