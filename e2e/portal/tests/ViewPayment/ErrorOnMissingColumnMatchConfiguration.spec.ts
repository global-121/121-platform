import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { deleteProgramFspConfigurationProperty } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  programIdPV,
  registrationsPvExcel,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations, accessToken }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: registrationsPvExcel,
    programId: programIdPV,
    navigateToPage: `/program/${programIdPV}/payments`,
  });

  await deleteProgramFspConfigurationProperty({
    programId: programIdPV,
    accessToken,
    configName: Fsps.excel,
    propertyName: FspConfigurationProperties.columnToMatch,
  });
});

test('[Excel fsp]: Error message should be shown in case no matching column was configured', async ({
  paymentsPage,
  paymentPage,
}) => {
  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({ onlyStep1: true });
    await paymentPage.validateToastMessageAndClose(
      'Something went wrong: "Missing required configuration columnToMatch for FSP Excel"',
    );
  });
});
