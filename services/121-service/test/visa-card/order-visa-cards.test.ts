import { HttpStatus } from '@nestjs/common';

import { VisaCardOrderStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-order-status.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { programIdVisa } from '@121-service/src/seed-data/mock/visa-card.data';
import {
  createVisaCardOrder,
  getVisaCardOrders,
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
  });

  it('should successfully order a batch of visa debit cards', async () => {
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

    // Assert
    expect(orderResponse.status).toBe(HttpStatus.CREATED);
    expect(orderResponse.body).toEqual({
      noOfCardsSent: noOfCards,
      noOfCardsOrdered: noOfCards,
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
