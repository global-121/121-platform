import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdPV } from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';
import { getFspLabels } from '@121-e2e/portal/helpers/get-fsp-labels';

const availableFsps = getFspLabels({
  fsps: [
    Fsps.excel,
    Fsps.intersolveVoucherWhatsapp,
    Fsps.intersolveVisa,
    Fsps.intersolveVoucherPaper,
  ],
});

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
    await registrationDataPage.validateProgramFspsPills({
      fspNames: availableFsps,
    });
  });
});
