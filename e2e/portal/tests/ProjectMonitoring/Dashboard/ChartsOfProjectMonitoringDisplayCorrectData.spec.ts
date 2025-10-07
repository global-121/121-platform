import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  doPaymentAndWaitForCompletion,
  seedIncludedRegistrations,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectMonitoring from '@121-e2e/portal/pages/ProjectMonitoringPage';

const defaultTransferValue = 25;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, programIdOCW, accessToken);

  // do payment for NLRC OCW
  await doPaymentAndWaitForCompletion({
    programId: programIdOCW,
    amount: defaultTransferValue,
    referenceIds: registrationsOCW.map((reg) => reg.referenceId),
    accessToken,
  });

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[30579] All Charts of Monitoring Dashboard tab display correct data', async ({
  page,
}) => {
  const projectMonitoring = new ProjectMonitoring(page);

  const projectTitle = 'NLRC OCW program';

  await test.step('Navigate to project`s monitoring page', async () => {
    await projectMonitoring.selectProgram(projectTitle);
    await projectMonitoring.navigateToProgramPage('Monitoring');
    await projectMonitoring.selectTab({ tabName: 'Dashboard' });
  });

  await test.step('Check if all charts data is correct', async () => {
    const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
      return output + pa.paymentAmountMultiplier * defaultTransferValue;
    }, 0);
    await projectMonitoring.assertDashboardChartsPresentByType({
      paymentAmountToValidate: defaultMaxTransferValue,
    });
  });
});
