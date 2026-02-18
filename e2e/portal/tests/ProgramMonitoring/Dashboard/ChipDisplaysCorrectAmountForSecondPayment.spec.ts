import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { doPaymentAndWaitForCompletion } from '@121-service/test/helpers/registration.helper';
import {
  programIdOCW,
  registrationsVisa,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const transferValueForSecondPayment = 10;

test.beforeEach(async ({ resetDBAndSeedRegistrations, page }) => {
  const { accessToken } = await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedPaidRegistrations: true,
    registrations: registrationsVisa,
    transferValue: 25,
    programId: programIdOCW,
  });

  // do 2nd payment
  await doPaymentAndWaitForCompletion({
    programId: programIdOCW,
    transferValue: transferValueForSecondPayment,
    referenceIds: registrationsVisa.map((reg) => reg.referenceId),
    accessToken,
  });
  // The test only worked because without the fixture it had to login and navigate to correct page
  // Now to maintain the same test flow we need to navigate to the same page as it was done before with login and navigation in the previous test
  // I could not find the source of the issue thus I left the navigation to the page for now
  await page.goto('/');
});

test('Chip displays correct amount for second payment', async ({
  programMonitoringPage,
}) => {
  const programTitle = 'NLRC OCW program';

  await test.step('Navigate to program`s monitoring page', async () => {
    await programMonitoringPage.selectProgram(programTitle);
    await programMonitoringPage.navigateToProgramPage('Monitoring');
  });

  await test.step('Check if last payment value is displayed correctly', async () => {
    // Count default max transfer value for second payment based on payment multipliers
    const defaultMaxTransferValue = registrationsVisa.reduce((output, pa) => {
      return (
        output + pa.paymentAmountMultiplier * transferValueForSecondPayment
      );
    }, 0);
    const totalCashValue = registrationsVisa.reduce((output, pa) => {
      return (
        output +
        pa.paymentAmountMultiplier * 25 +
        pa.paymentAmountMultiplier * transferValueForSecondPayment
      );
    }, 0);

    await programMonitoringPage.assertMonitoringTabElements({
      shouldHaveIframe: true,
    });
    await programMonitoringPage.assertValuesInMonitoringTab({
      peopleIncluded: 4,
      peopleRegistered: 4,
      lastPaymentAmount: `€${defaultMaxTransferValue.toString()}`,
      cashDisbursed: `€${totalCashValue.toString()}`,
      remainingBudget: `-€${totalCashValue.toString()}`,
      paymentsDone: 2,
    });
  });
});
