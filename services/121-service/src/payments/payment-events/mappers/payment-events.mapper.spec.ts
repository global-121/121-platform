import { PaymentEventEntity } from '@121-service/src/payments/payment-events/entities/payment-event.entity';
import { PaymentEventAttributeEntity } from '@121-service/src/payments/payment-events/entities/payment-event-attribute.entity';
import { PaymentEvent } from '@121-service/src/payments/payment-events/enums/payment-event.enum';
import { PaymentEventAttributeKey } from '@121-service/src/payments/payment-events/enums/payment-event-attribute-key.enum';
import { PaymentEventsMapper } from '@121-service/src/payments/payment-events/mappers/payment-events.mapper';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

describe('PaymentEventsMapper', () => {
  const testUserId = 1;
  const testUserName = 'test.user@example.com';
  const testDate = new Date('2024-01-01T10:00:00Z');
  const testPaymentId = 100;
  const testNote = 'Test note content';

  const mockUser = new UserEntity();
  mockUser.id = testUserId;
  mockUser.username = testUserName;

  const createMockPaymentEventEntity = (
    id: number,
    type: PaymentEvent,
    user?: UserEntity,
    attributes?: PaymentEventAttributeEntity[],
  ): PaymentEventEntity => {
    const entity = new PaymentEventEntity();
    entity.id = id;
    entity.type = type;
    entity.created = testDate;
    entity.updated = testDate;
    entity.paymentId = testPaymentId;
    entity.user = user;
    entity.attributes = attributes || [];
    return entity;
  };

  const createMockAttributeEventEntity = (
    key: PaymentEventAttributeKey,
    value: string,
  ): PaymentEventAttributeEntity => {
    const entity = new PaymentEventAttributeEntity();
    entity.id = 1;
    entity.key = key;
    entity.value = value;
    entity.created = new Date();
    entity.updated = new Date();
    return entity;
  };

  describe('mapToPaymentEventsDto', () => {
    it('should map payment event entities to return DTOs with user information', () => {
      // Arrange
      const noteAttribute = createMockAttributeEventEntity(
        PaymentEventAttributeKey.note,
        testNote,
      );
      const paymentEvents = [
        createMockPaymentEventEntity(1, PaymentEvent.created, mockUser),
        createMockPaymentEventEntity(2, PaymentEvent.note, mockUser, [
          noteAttribute,
        ]),
      ];

      // Act
      const result = PaymentEventsMapper.mapToPaymentEventsDto(paymentEvents);

      const { meta, data } = result;
      // Assert
      expect(meta).toEqual({
        count: {
          [PaymentEvent.created]: 1,
          [PaymentEvent.note]: 1,
        },
        total: 2,
      });

      expect(data).toHaveLength(2);

      expect(data[0]).toEqual({
        id: 1,
        type: PaymentEvent.created,
        created: testDate,
        user: {
          id: testUserId,
          username: testUserName,
        },
        attributes: {},
      });

      expect(data[1]).toEqual({
        id: 2,
        type: PaymentEvent.note,
        created: testDate,
        user: {
          id: testUserId,
          username: testUserName,
        },
        attributes: {
          [PaymentEventAttributeKey.note]: testNote,
        },
      });
    });

    it('should handle events without user information', () => {
      // Arrange
      const paymentEvents = [
        createMockPaymentEventEntity(1, PaymentEvent.created, undefined),
      ];

      // Act
      const result = PaymentEventsMapper.mapToPaymentEventsDto(paymentEvents);
      const { meta, data } = result;

      // Assert
      expect(meta).toEqual({
        count: {
          [PaymentEvent.created]: 1,
        },
        total: 1,
      });

      expect(data).toHaveLength(1);

      expect(data[0]).toEqual({
        id: 1,
        type: PaymentEvent.created,
        created: testDate,
        user: null,
        attributes: {},
      });
    });

    it('should handle empty input array', () => {
      // Arrange
      const paymentEvents: PaymentEventEntity[] = [];

      // Act
      const result = PaymentEventsMapper.mapToPaymentEventsDto(paymentEvents);
      const { meta, data } = result;

      // Assert
      expect(meta).toEqual({
        count: {},
        total: 0,
      });

      expect(data).toHaveLength(0);
    });
  });
});
