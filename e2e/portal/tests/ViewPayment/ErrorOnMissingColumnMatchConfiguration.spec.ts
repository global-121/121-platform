import { test } from '@playwright/test';

import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPV from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { deleteProgramFspConfigurationProperty } from '@121-service/test/helpers/program-fsp-configuration.helper';
import { seedIncludedRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdPV,
  registrationsPvExcel,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import PaymentPage from '@121-e2e/portal/pages/PaymentPage';
import PaymentsPage from '@121-e2e/portal/pages/PaymentsPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await deleteProgramFspConfigurationProperty({
    programId: programIdPV,
    accessToken,
    configName: Fsps.excel,
    propertyName: FspConfigurationProperties.columnToMatch,
  });
  await seedIncludedRegistrations(
    registrationsPvExcel,
    programIdPV,
    accessToken,
  );

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[Excel fsp]: Error message should be shown in case no matching column was configured', async ({
  page,
}) => {
  const paymentsPage = new PaymentsPage(page);
  const paymentPage = new PaymentPage(page);

  const programTitle = NLRCProgramPV.titlePortal.en;

  await test.step('Navigate to Program payments', async () => {
    await paymentsPage.selectProgram(programTitle);

    await paymentsPage.navigateToProgramPage('Payments');
  });

  await test.step('Do payment', async () => {
    await paymentsPage.createPayment({ onlyStep1: true });
    await paymentPage.validateToastMessageAndClose(
      'Something went wrong: "Missing required configuration columnToMatch for FSP Excel"',
    );
  });
});
