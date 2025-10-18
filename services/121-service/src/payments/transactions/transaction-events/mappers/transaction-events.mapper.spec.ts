import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventType } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-type.enum';
import { TransactionEventsMapper } from '@121-service/src/payments/transactions/transaction-events/mappers/transaction-events.mapper';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

describe('TransactionEventsMapper', () => {
  const testUserId = 1;
  const testUserName = 'test.user@example.com';
  const testDate = new Date('2024-01-01T10:00:00Z');
  const testTransactionId = 1;
  const testFspConfigId = 1;
  const testEventData1 = {
    errorMessage: null,
    isSuccessfullyCompleted: true,
    description: TransactionEventDescription.created,
    type: TransactionEventType.created,
  };
  const testEventData2 = {
    errorMessage: 'Test error message',
    isSuccessfullyCompleted: false,
    description: TransactionEventDescription.onafriqRequestSent,
    type: TransactionEventType.processingStep,
  };

  const mockUser = new UserEntity();
  mockUser.id = testUserId;
  mockUser.username = testUserName;

  const createMockTransactionEventEntity = ({
    id,
    type,
    description,
    isSuccessfullyCompleted,
    programFspConfigurationId,
    errorMessage,
    user,
  }: {
    id: number;
    type: TransactionEventType;
    description: TransactionEventDescription;
    isSuccessfullyCompleted: boolean;
    programFspConfigurationId: number;
    errorMessage: string | null;
    user?: UserEntity;
  }): TransactionEventEntity => {
    const entity = new TransactionEventEntity();
    entity.id = id;
    entity.type = type;
    entity.created = testDate;
    entity.updated = testDate;
    entity.transactionId = testTransactionId;
    entity.user = user;
    entity.description = description;
    entity.isSuccessfullyCompleted = isSuccessfullyCompleted;
    entity.errorMessage = errorMessage;
    entity.programFspConfigurationId = programFspConfigurationId;
    return entity;
  };

  describe('mapToTransactionEventsDto', () => {
    it('should map transaction event entities to return DTOs with user information', () => {
      // Arrange
      const transactionEvents = [
        createMockTransactionEventEntity({
          id: 1,
          type: testEventData1.type,
          description: testEventData1.description,
          isSuccessfullyCompleted: testEventData1.isSuccessfullyCompleted,
          programFspConfigurationId: testFspConfigId,
          errorMessage: testEventData1.errorMessage,
          user: mockUser,
        }),
        createMockTransactionEventEntity({
          id: 2,
          type: testEventData2.type,
          description: testEventData2.description,
          isSuccessfullyCompleted: testEventData2.isSuccessfullyCompleted,
          programFspConfigurationId: testFspConfigId,
          errorMessage: testEventData2.errorMessage,
          user: mockUser,
        }),
      ];

      // Act
      const result =
        TransactionEventsMapper.mapToTransactionEventsDto(transactionEvents);
      const { meta, data } = result;
      // Assert
      expect(meta).toEqual({
        count: {
          [TransactionEventType.created]: 1,
          [TransactionEventType.processingStep]: 1,
        },
        total: 2,
      });

      expect(data).toHaveLength(2);

      expect(data[0]).toEqual({
        id: 1,
        type: testEventData1.type,
        created: testDate,
        user: {
          id: testUserId,
          username: testUserName,
        },
        description: testEventData1.description,
        isSuccessfullyCompleted: testEventData1.isSuccessfullyCompleted,
        errorMessage: testEventData1.errorMessage,
        programFspConfigurationId: testFspConfigId,
      });

      expect(data[1]).toEqual({
        id: 2,
        type: testEventData2.type,
        created: testDate,
        user: {
          id: testUserId,
          username: testUserName,
        },
        description: testEventData2.description,
        isSuccessfullyCompleted: testEventData2.isSuccessfullyCompleted,
        errorMessage: testEventData2.errorMessage,
        programFspConfigurationId: testFspConfigId,
      });
    });
  });
});
