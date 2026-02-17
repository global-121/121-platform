import { format } from 'date-fns';

import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationsOCW,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

const currentDate = new Date();
const registrationByCreationDate = format(currentDate, 'yyyy-MM-dd');
const formattedDate = format(currentDate, 'dd/MM/yyyy');
const formattedMonth = format(currentDate, 'yyyy-MM');

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    seedPaidRegistrations: true,
    registrations: registrationsOCW,
    programId: programIdOCW,
    navigateToPage: `en-GB/program/${programIdOCW}/monitoring/dashboard`,
  });
});

test('All Charts of Monitoring Dashboard tab display correct data', async ({
  programMonitoringPage,
}) => {
  await test.step('Check if all elements of Dashboard are displayed', async () => {
    await programMonitoringPage.assertDashboardCharts({
      regPerStatus: 'Included: 5',
      regPerDuplicateStatus: {
        duplicate: 2,
        unique: 3,
      },
      regByCreationDate: `${registrationByCreationDate}: 5`,
      transactionsPerPaymentStatus: {
        date: formattedDate,
        successful: 5,
      },
      amountPerPaymentStatus: {
        date: formattedDate,
        successful: 200,
      },
      amountPerMonth: {
        date: formattedMonth,
        successful: 200,
      },
    });
  });
});
