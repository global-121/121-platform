import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const configuredFsps = [
  FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherWhatsapp].defaultLabel.en,
].filter((label): label is string => label !== undefined);

const availableFsps = [
  FSP_SETTINGS[Fsps.excel].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherPaper].defaultLabel.en,
  FSP_SETTINGS[Fsps.safaricom].defaultLabel.en,
  FSP_SETTINGS[Fsps.airtel].defaultLabel.en,
  FSP_SETTINGS[Fsps.commercialBankEthiopia].defaultLabel.en,
  FSP_SETTINGS[Fsps.nedbank].defaultLabel.en,
  FSP_SETTINGS[Fsps.onafriq].defaultLabel.en,
].filter((label): label is string => label !== undefined);

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });
});

test('Validate that only configured FSPs are present as configured', async ({
  homePage,
  registrationsPage,
  fspSettingsPage,
}) => {
  await test.step('Navigate to program', async () => {
    await homePage.selectProgram('NLRC OCW program');
  });

  await test.step('Navigate to FSP configuration', async () => {
    await registrationsPage.navigateToProgramPage('Settings');
    await fspSettingsPage.clickEditFspSection();
  });

  await test.step('Validate only assigned FSPs are visible at first', async () => {
    await fspSettingsPage.validateFspVisibility({ fspNames: configuredFsps });
  });

  await test.step('Validate unassigned FSPs are not visible', async () => {
    await fspSettingsPage.validateFspVisibility({
      fspNames: availableFsps,
      visible: false,
    });
  });

  await test.step('Validate that both assigned and configurable FSPs are visible', async () => {
    await fspSettingsPage.clickAddAnotherFspButton();
    await fspSettingsPage.validateFspVisibility({
      fspNames: [...configuredFsps, ...availableFsps],
    });
  });
});
