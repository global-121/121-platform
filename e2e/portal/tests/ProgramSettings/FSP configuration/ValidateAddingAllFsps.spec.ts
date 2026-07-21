import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdOCW } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import { getFspLabels } from '@121-e2e/portal/helpers/get-fsp-labels';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    navigateToPage: `/program/${programIdOCW}/settings`,
  });
});

const fspsToDelete = getFspLabels({
  fsps: [Fsps.intersolveVisa, Fsps.intersolveVoucherWhatsapp],
});

const fspsToAdd = getFspLabels({
  fsps: [Fsps.commercialBankEthiopia, Fsps.onafriq, Fsps.safaricom],
});

test('Add all available FSPs', async ({
  registrationsPage,
  fspSettingsPage,
  programSettingsPage,
}) => {
  await test.step('Delete All FSPs', async () => {
    await programSettingsPage.changeFspSelectionForProgram({
      fspNames: fspsToDelete,
    });
  });

  await test.step('Add FSPs that have missing required attributes and validate their automatic configuration', async () => {
    await programSettingsPage.clickProgramInformation();

    // Add commercialBankEthiopia, Onafriq and Safaricom FSPs to the program,
    // which have required attributes that are not yet configured
    await programSettingsPage.changeFspSelectionForProgram({
      fspNames: fspsToAdd,
    });

    const allRequiredAttributes =
      await fspSettingsPage.getAllRequiredAttributes({
        fspConfiguration: [
          FSP_SETTINGS[Fsps.safaricom],
          FSP_SETTINGS[Fsps.commercialBankEthiopia],
          FSP_SETTINGS[Fsps.onafriq],
        ],
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
});
