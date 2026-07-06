import { HttpStatus } from '@nestjs/common';

import { VisaCardOrderStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-order-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import { updateProgramCardDistributionByMail } from '@121-service/test/helpers/program-fsp-configuration.helper';
import {
  createVisaCardOrder,
  getVisaCardOrders,
  waitForVisaCardOrdersToComplete,
} from '@121-service/test/helpers/registration.helper';
import {
  getAccessToken,
  resetDB,
} from '@121-service/test/helpers/utility.helper';

describe('Order visa debit cards in batch', () => {
  let accessToken: string;

  beforeAll(async () => {
    await resetDB({ seedScript: SeedScript.nlrcMultiple });
    accessToken = await getAccessToken();
    // Disable card distribution by mail to allow batch ordering
    await updateProgramCardDistributionByMail({
      isCardDistributionByMail: false,
      accessToken,
    });
  });

  it('should accept a card order and process it in the background', async () => {
    // Arrange
    const noOfCards = 3;

    // Act
    const orderResponse = await createVisaCardOrder({
      programId: programIdVisa,
      accessToken,
      noOfCards,
      addressStreet: 'Damrak',
      addressHouseNumber: '1',
      addressHouseNumberAddition: 'A',
      addressPostalCode: '1011AB',
      addressCity: 'Amsterdam',
      addressee: 'John Doe',
    });

    // Assert - endpoint returns 202 Accepted with order id
    expect(orderResponse.status).toBe(HttpStatus.ACCEPTED);
    expect(orderResponse.body).toEqual({
      id: expect.any(Number),
      noOfCards,
    });

    const immediateOrdersResponse = await getVisaCardOrders({
      programId: programIdVisa,
      accessToken,
    });
    expect(immediateOrdersResponse.status).toBe(HttpStatus.OK);
    const immediateOrder = immediateOrdersResponse.body.find(
      (order: { id: number }) => order.id === orderResponse.body.id,
    );
    expect(immediateOrder).toEqual(
      expect.objectContaining({
        id: orderResponse.body.id,
        status: VisaCardOrderStatus.Processing,
        noOfCards,
      }),
    );
    expect(immediateOrder.noOfCardsOrdered).toBeLessThan(noOfCards);

    // Poll until background processing completes
    await waitForVisaCardOrdersToComplete({
      programId: programIdVisa,
      accessToken,
    });

    const ordersResponse = await getVisaCardOrders({
      programId: programIdVisa,
      accessToken,
    });
    expect(ordersResponse.status).toBe(HttpStatus.OK);
    expect(ordersResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: VisaCardOrderStatus.Completed,
          noOfCards,
          noOfCardsOrdered: noOfCards,
          address: 'John Doe, Damrak 1 A, 1011AB, Amsterdam',
        }),
      ]),
    );
  });
});
