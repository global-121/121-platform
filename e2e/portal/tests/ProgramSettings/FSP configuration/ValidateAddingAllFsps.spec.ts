import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdSafaricom } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import { getFspLabels } from '@121-e2e/portal/helpers/get-fsp-labels';

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
  ],
});

test('Add all available FSPs via the budget page', async ({
  fspSettingsPage,
  programSettingsPage,
}) => {
  await test.step('Remove Safaricom FSP', async () => {
    await programSettingsPage.changeFspSelectionForProgram({
      fspNames: getFspLabels({ fsps: [Fsps.safaricom] }),
    });
    await fspSettingsPage.clickFspIntegration();
    await fspSettingsPage.validateInfoCardMessage({
      dataTestId: 'fsp-integration-no-fsps-card',
      expectedMessage: 'No FSPs found',
    });
  });

  await test.step('Add all available FSPs', async () => {
    await programSettingsPage.clickProgramInformation();
    await programSettingsPage.changeFspSelectionForProgram({
      fspNames: allFsps,
    });
  });

  await test.step('Validate that all FSPs are added on the budget page', async () => {
    await fspSettingsPage.clickFspIntegration();
    await fspSettingsPage.validateProgramFspCards({
      fspNames: allFsps,
    });
  });
});
