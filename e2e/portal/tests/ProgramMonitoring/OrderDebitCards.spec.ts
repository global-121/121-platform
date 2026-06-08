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

const orderDebitCardOrder = {
  noOfCards: '100',
  addressPostalCode: '2593 HT',
  addressCity: 'Den Haag',
  addressStreet: 'Anna van Saksenlaan',
  addressHouseNumber: '50',
  addressHouseNumberAddition: 'K',
  phoneNumber: '123456789',
  addressee: 'John Doe',
};

test("All elements of Monitoring's `Data Changes` sub-page display correct data for Registration", async ({
  programMonitoringPage,
}) => {
  await test.step("Navigate to monitoring's 'Debit cards' tab", async () => {
    await programMonitoringPage.goto(
      `/program/${programIdOCW}/monitoring/dashboard`,
    );
    await programMonitoringPage.selectTab({ tabName: 'Debit cards' });
  });

  await test.step('Order cards', async () => {
    await programMonitoringPage.orderCards({ orderDebitCardOrder });
  });

  await test.step('Verify that the order is listed in the table', async () => {
    await programMonitoringPage.expectCardOrdersTableToContainOrder({
      orderDebitCardOrder,
    });
  });
});
