import { VisaCardOrderMapper } from '@121-service/src/fsp-integrations/account-management/intersolve-visa/mappers/visa-card-order.mapper';
import { VisaCardOrderEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-card-order.entity';
import { VisaCardOrderStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-order-status.enum';

describe('VisaCardOrderMapper', () => {
  function createVisaCardOrderEntity(
    overrides: Partial<VisaCardOrderEntity>,
  ): VisaCardOrderEntity {
    return Object.assign(new VisaCardOrderEntity(), {
      id: 1,
      programId: 1,
      userId: 1,
      status: VisaCardOrderStatus.Completed,
      noOfCards: 1,
      noOfCardsOrdered: 1,
      addressee: 'Default User',
      addressStreet: 'Default',
      addressHouseNumber: '1',
      addressHouseNumberAddition: null,
      addressPostalCode: '0000AA',
      addressCity: 'Default City',
      created: new Date('2026-05-26T08:30:00.000Z'),
      updated: new Date('2026-05-26T08:30:00.000Z'),
      user: undefined,
      ...overrides,
    });
  }

  it('maps an entity to a response dto', () => {
    const entity = createVisaCardOrderEntity({
      id: 42,
      status: VisaCardOrderStatus.Completed,
      noOfCards: 5,
      noOfCardsOrdered: 5,
      addressee: 'John Doe',
      addressStreet: 'Damrak',
      addressHouseNumber: '1',
      addressHouseNumberAddition: 'A',
      addressPostalCode: '1011AB',
      addressCity: 'Amsterdam',
      userId: 7,
      user: {
        username: 'manager@example.org',
      } as VisaCardOrderEntity['user'],
      created: new Date('2026-05-26T08:30:00.000Z'),
    });

    const result = VisaCardOrderMapper.mapEntityToDto({ entity });

    expect(result).toEqual({
      id: 42,
      status: VisaCardOrderStatus.Completed,
      noOfCards: 5,
      noOfCardsOrdered: 5,
      address: 'John Doe, Damrak 1 A, 1011AB, Amsterdam',
      orderedByUsername: 'manager@example.org',
      created: new Date('2026-05-26T08:30:00.000Z'),
    });
  });

  it('falls back to userId when username is missing', () => {
    const entity = createVisaCardOrderEntity({
      id: 43,
      noOfCardsOrdered: 1,
      addressee: 'Jane Doe',
      addressStreet: 'Dam',
      addressHouseNumber: '5',
      addressHouseNumberAddition: null,
      addressPostalCode: '1000AA',
      addressCity: 'Amsterdam',
      userId: 99,
      created: new Date('2026-05-27T08:30:00.000Z'),
    });

    const result = VisaCardOrderMapper.mapEntityToDto({ entity });

    expect(result.orderedByUsername).toBe('99');
  });
});
