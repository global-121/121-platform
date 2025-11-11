import { test } from '@playwright/test';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPv from '@121-service/src/seed-data/program/program-nlrc-pv.json';
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
  programIdPV,
  registrationsOCW,
  registrationsVoucher,
} from '@121-service/test/registrations/pagination/pagination-data';

import BasePage from '@121-e2e/portal/pages/BasePage';
import LoginPage from '@121-e2e/portal/pages/LoginPage';
import ProjectMonitoring from '@121-e2e/portal/pages/ProjectMonitoringPage';

const defaultTransferValue = 25;

test.beforeEach(async ({ page }) => {
  await resetDB(SeedScript.nlrcMultiple, __filename);
  const accessToken = await getAccessToken();
  await seedIncludedRegistrations(registrationsOCW, programIdOCW, accessToken);
  await seedIncludedRegistrations(
    registrationsVoucher,
    programIdPV,
    accessToken,
  );
  // do payment for NLRC OCW
  await doPaymentAndWaitForCompletion({
    programId: programIdOCW,
    transferValue: defaultTransferValue,
    referenceIds: registrationsOCW.map((reg) => reg.referenceId),
    accessToken,
  });
  // do payment for NLRC PV
  await doPaymentAndWaitForCompletion({
    programId: programIdPV,
    transferValue: defaultTransferValue,
    referenceIds: registrationsVoucher.map((reg) => reg.referenceId),
    accessToken,
  });
  // Login
  const loginPage = new LoginPage(page);
  await page.goto('/');
  await loginPage.login();
});

test('All elements of Monitoring page display correct data for OCW', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const projectMonitoring = new ProjectMonitoring(page);

  const projectTitle = 'NLRC OCW program';

  await test.step('Navigate to project`s monitoring page', async () => {
    await basePage.selectProgram(projectTitle);
    await projectMonitoring.navigateToProgramPage('Monitoring');
  });

  await test.step('Check if all elements are displayed', async () => {
    const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
      return output + pa.paymentAmountMultiplier * defaultTransferValue;
    }, 0);

    await projectMonitoring.assertMonitoringTabElements({
      shouldHaveIframe: true,
    });
    await projectMonitoring.assertValuesInMonitoringTab({
      peopleIncluded: 5,
      peopleRegistered: 5,
      lastPaymentAmount: `€${defaultMaxTransferValue.toString()}`,
      cashDisbursed: `€${defaultMaxTransferValue.toString()}`,
      remainingBudget: `-€${defaultMaxTransferValue.toString()}`,
      paymentsDone: 1,
      newRegistrations: 0,
    });
  });
});

test('All elements of Monitoring page display correct data for NLRC', async ({
  page,
}) => {
  const basePage = new BasePage(page);
  const projectMonitoring = new ProjectMonitoring(page);

  const projectTitle = 'NLRC Direct Digital Aid Program (PV)';

  await test.step('Navigate to project`s monitoring page', async () => {
    await basePage.selectProgram(projectTitle);
    await projectMonitoring.navigateToProgramPage('Monitoring');
  });

  await test.step('Check if all elements are displayed', async () => {
    const defaultMaxTransferValue = registrationsVoucher.reduce(
      (output, pa) => {
        return output + pa.paymentAmountMultiplier * defaultTransferValue;
      },
      0,
    );
    const remainingBudget = NLRCProgramPv.budget - defaultMaxTransferValue;

    await projectMonitoring.assertMonitoringTabElements({
      shouldHaveIframe: false,
    });
    await projectMonitoring.assertValuesInMonitoringTab({
      peopleIncluded: 2,
      peopleRegistered: 2,
      cashDisbursed: `€${defaultMaxTransferValue.toString()}`,
      remainingBudget: `€${remainingBudget.toLocaleString()}`,
      paymentsDone: 1,
      newRegistrations: 0,
    });
  });
});
