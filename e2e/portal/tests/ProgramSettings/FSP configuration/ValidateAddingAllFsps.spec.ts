import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const fspsToDelete = [
  FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherWhatsapp].defaultLabel.en,
].filter((label): label is string => label !== undefined);

const availableFsps = [
  ...fspsToDelete,
  FSP_SETTINGS[Fsps.excel].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherPaper].defaultLabel.en,
  FSP_SETTINGS[Fsps.safaricom].defaultLabel.en,
  FSP_SETTINGS[Fsps.airtel].defaultLabel.en,
  FSP_SETTINGS[Fsps.commercialBankEthiopia].defaultLabel.en,
  FSP_SETTINGS[Fsps.nedbank].defaultLabel.en,
  FSP_SETTINGS[Fsps.onafriq].defaultLabel.en,
].filter((label): label is string => label !== undefined);

const fspsWithRequiredAttributes = [
  FSP_SETTINGS[Fsps.safaricom],
  FSP_SETTINGS[Fsps.commercialBankEthiopia],
  FSP_SETTINGS[Fsps.onafriq],
];

const fspsConfiguredInKobo = [
  FSP_SETTINGS[Fsps.intersolveVoucherPaper].defaultLabel.en,
  FSP_SETTINGS[Fsps.airtel].defaultLabel.en,
  FSP_SETTINGS[Fsps.nedbank].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherWhatsapp].defaultLabel.en,
  FSP_SETTINGS[Fsps.excel].defaultLabel.en,
].filter((label): label is string => label !== undefined);

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
  });
});

test('Add all available FSPs', async ({
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

  await test.step('Delete All FSPs', async () => {
    await fspSettingsPage.deleteFsp({
      fspNames: fspsToDelete,
    });
  });

  await test.step('Validate all FSPs are ready for configuration', async () => {
    await fspSettingsPage.validateFspVisibility({
      fspNames: availableFsps,
    });
  });

  await test.step('Add FSPs that have missing required attributes and validate their automatic configuration', async () => {
    const allRequiredAttributes =
      await fspSettingsPage.addFspsWithRequiredAttributes({
        fspConfiguration: fspsWithRequiredAttributes,
      });

    await fspSettingsPage.navigateToProgramPage('Registrations');

    // For some reason we mutate 'fullName' to 'Full name' in
    // applyProgramRegistrationAttributesFallbackIfNecessary when a program is created.
    // In the frontend - on the registration table - it is displayed as 'Name'...
    // So for now I'm removing 'fullName' from the required attributes array I'm checking for
    // Related to #AB32551

    for (const attribute of allRequiredAttributes.filter(
      (attr) => attr !== 'fullName',
    )) {
      await registrationsPage.checkColumnAvailability({
        column: attribute,
        shouldBeAvailable: true,
      });
    }
  });

  await test.step('Add all available FSPs that match Kobo form configuration', async () => {
    await registrationsPage.navigateToProgramPage('Settings');
    await fspSettingsPage.clickEditFspSection();
    await fspSettingsPage.addFsp({ fspNames: fspsConfiguredInKobo });
  });

  await test.step('Validate that only selected FSPs were configured', async () => {
    await fspSettingsPage.validateVisibilityOfOnlyConfiguredFsps({
      fspNames: fspsConfiguredInKobo,
    });
  });
});
