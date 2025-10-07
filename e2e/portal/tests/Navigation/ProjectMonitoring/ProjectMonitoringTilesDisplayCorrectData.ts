import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgram from '@121-service/src/seed-data/program/program-nlrc-ocw.json';
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
  registrationsVisa,
} from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectMonitoring from '@121-e2e/portal/pages/ProjectMonitoringPage';

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsVisa, programIdOCW, accessToken);
  await doPaymentAndWaitForCompletion({
    programId: programIdOCW,
    amount: 25,
    referenceIds: registrationsVisa.map((reg) => reg.referenceId),
    accessToken,
  });

  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('[38377] Chip displays correct amount for second payment', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const projectMonitoring = new ProjectMonitoring(page);

  const projectTitle = 'NLRC OCW program';

  await test.step('Navigate to project`s monitoring page', async () => {
    await basePage.selectProgram(projectTitle);
    await projectMonitoring.navigateToProgramPage('Monitoring');
  });

  await test.step('Check if last payment value is displayed correctly', async () => {
    // Count default max transfer value for second payment based on payment multipliers
    const defaultTransferValue = NLRCProgram.fixedTransferValue;
    const defaultMaxTransferValue = registrationsVisa.reduce((output, pa) => {
      return output + pa.paymentAmountMultiplier * defaultTransferValue;
    }, 0);

    await projectMonitoring.assertMonitoringTabElements({
      shouldHaveIframe: true,
    });
    await projectMonitoring.assertValuesInMonitoringTab({
      peopleIncluded: 4,
      peopleRegistered: 4,
      lastPaymentAmount: `€${defaultMaxTransferValue.toString()}`,
    });
  });
});
