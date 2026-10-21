import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  deleteProgramFspConfiguration,
  postProgramFspConfiguration,
} from '@121-service/test/helpers/program-fsp-configuration.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import { getAccessToken } from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPvExcel,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    skipSeedRegistrations: true,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/payments`,
  });

  const accessToken = await getAccessToken();

  await deleteProgramFspConfiguration({
    programId: programIdPV,
    accessToken,
    name: Fsps.excel,
  });
  await postProgramFspConfiguration({
    programId: programIdPV,
    accessToken,
    body: {
      name: Fsps.excel,
      label: { en: 'Excel Payment Instructions' },
      fspName: Fsps.excel,
    },
  });
  await seedIncludedRegistrations(
    registrationsPvExcel,
    programIdPV,
    accessToken,
  );
});

test('[Excel fsp]: Error message should be shown in case no matching column was configured', async ({
  paymentsPage,
  paymentPage,
}) => {
  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({ onlyStep1: true });
    await paymentPage.validateToastMessageAndClose(
      'Error Something went wrong: "Program FSP configuration Excel is not fully configured"',
    );
  });
});
