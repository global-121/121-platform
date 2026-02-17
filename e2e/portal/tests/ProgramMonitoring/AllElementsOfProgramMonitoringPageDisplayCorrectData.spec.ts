import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import NLRCProgramPv from '@121-service/src/seed-data/program/program-nlrc-pv.json';
import { seedPaidRegistrations } from '@121-service/test/helpers/registration.helper';
import {
  programIdOCW,
  programIdPV,
  registrationsOCW,
  registrationsVoucher,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const defaultTransferValue = 25;

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  //Reset DB and seed paid registrations for NLRC OCW
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedPaidRegistrations: true,
    registrations: registrationsOCW,
    programId: programIdOCW,
    transferValue: defaultTransferValue,
  });
  // Seed paid registrations for NLRC PV
  await seedPaidRegistrations({
    registrations: registrationsVoucher,
    programId: programIdPV,
    transferValue: defaultTransferValue,
  });
});

test('All elements of Monitoring page display correct data for NLRC OCW', async ({
  programMonitoringPage,
}) => {
  await test.step('Navigate to program`s monitoring page', async () => {
    await programMonitoringPage.goto(
      `/program/${programIdOCW}/monitoring/dashboard`,
    );
  });

  await test.step('Check if all elements are displayed', async () => {
    const defaultMaxTransferValue = registrationsOCW.reduce((output, pa) => {
      return output + pa.paymentAmountMultiplier * defaultTransferValue;
    }, 0);

    await programMonitoringPage.assertMonitoringTabElements({
      shouldHaveIframe: true,
    });
    await programMonitoringPage.assertValuesInMonitoringTab({
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

test('All elements of Monitoring page display correct data for NLRC PV', async ({
  programMonitoringPage,
}) => {
  await test.step('Navigate to program`s monitoring page', async () => {
    await programMonitoringPage.goto(
      `/program/${programIdPV}/monitoring/dashboard`,
    );
  });

  await test.step('Check if all elements are displayed', async () => {
    const defaultMaxTransferValue = registrationsVoucher.reduce(
      (output, pa) => {
        return output + pa.paymentAmountMultiplier * defaultTransferValue;
      },
      0,
    );
    const remainingBudget = NLRCProgramPv.budget - defaultMaxTransferValue;

    await programMonitoringPage.assertMonitoringTabElements({
      shouldHaveIframe: false,
    });
    await programMonitoringPage.assertValuesInMonitoringTab({
      peopleIncluded: 2,
      peopleRegistered: 2,
      cashDisbursed: `€${defaultMaxTransferValue.toString()}`,
      remainingBudget: `€${remainingBudget.toLocaleString()}`,
      paymentsDone: 1,
      newRegistrations: 0,
    });
  });
});
