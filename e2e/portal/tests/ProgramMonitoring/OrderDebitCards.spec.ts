import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import {
  programIdOCW,
  registrationOCW4,
} from '@121-service/test/registrations/pagination/pagination-data';

import { customSharedFixture as test } from '@121-e2e/portal/fixtures/fixture';

test.beforeEach(async ({ resetDBAndSeedRegistrations }) => {
  await resetDBAndSeedRegistrations({
    seedScript: SeedScript.nlrcMultiple,
    registrations: [registrationOCW4],
    programId: programIdOCW,
  });
});

const orderDebitCardOrderDetails = {
  noOfCards: '2',
  addressee: 'John Doe',
  address: '',
  houseNumber: '1',
  city: 'Anytown',
  postalCode: '1234AB',
};

test("All elements of Monitoring's `Data Changes` sub-page display correct data for Registration", async ({
  programMonitoringPage,
  // tableComponent,
}) => {
  await test.step("Navigate to monitoring's 'Debit cards' tab", async () => {
    await programMonitoringPage.goto(
      `/program/${programIdOCW}/monitoring/dashboard`,
    );
    await programMonitoringPage.selectTab({ tabName: 'Debit cards' });
  });

  await test.step('Order cards', async () => {
    await programMonitoringPage.orderCards(orderDebitCardOrderDetails);
  });

  await test.step('Verify that the order is listed in the table', async () => {
    await programMonitoringPage.expectCardOrdersTableToHaveRow(
      orderDebitCardOrderDetails,
    );
  });
});
