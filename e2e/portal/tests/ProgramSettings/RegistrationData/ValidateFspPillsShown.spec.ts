import { FSP_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-settings.const';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const availableFsps = [
  FSP_SETTINGS[Fsps.excel].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherWhatsapp].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVisa].defaultLabel.en,
  FSP_SETTINGS[Fsps.intersolveVoucherPaper].defaultLabel.en,
].filter((label): label is string => label !== undefined);

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/settings/registration-data`,
  });
});

test('Check if all FSPs are shown in the Registration integration section', async ({
  registrationDataPage,
}) => {
  await test.step('Validate required fields', async () => {
    await registrationDataPage.clickRegistrationDataSection();
    await registrationDataPage.validateFspPills({
      fspNames: availableFsps,
    });
  });
});
