import { TestBed } from '@automock/jest';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsService } from '@121-service/src/payments/transactions/transaction-events/transaction-events.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

const context = {
  transactionId: 1,
  userId: 2,
  programFspConfigurationId: 3,
};

describe('TransactionsService', () => {
  let transactionsService: TransactionsService;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let transactionEventsService: jest.Mocked<TransactionEventsService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(TransactionsService).compile();

    transactionsService = unit;
    transactionRepository = unitRef.get(TransactionRepository);
    transactionEventsService = unitRef.get(TransactionEventsService);
  });

  describe('saving initial-message progress', () => {
    it('should not create an event when a failed transaction cannot be set to waiting', async () => {
      // Arrange
      transactionRepository.updateStatusUnlessIn.mockResolvedValue(false);

      // Act
      await transactionsService.saveProgressUnlessTransactionFailed({
        context,
        description:
          TransactionEventDescription.intersolveVoucherInitialMessageSent,
        newTransactionStatus: TransactionStatusEnum.waiting,
      });

      // Assert
      expect(transactionRepository.updateStatusUnlessIn).toHaveBeenCalledWith({
        transactionId: context.transactionId,
        newTransactionStatus: TransactionStatusEnum.waiting,
        excludedStatuses: [TransactionStatusEnum.error],
      });
      expect(transactionEventsService.createEvent).not.toHaveBeenCalled();
    });

    it('should create an event when the waiting status was set', async () => {
      // Arrange
      transactionRepository.updateStatusUnlessIn.mockResolvedValue(true);

      // Act
      await transactionsService.saveProgressUnlessTransactionFailed({
        context,
        description:
          TransactionEventDescription.intersolveVoucherInitialMessageSent,
        newTransactionStatus: TransactionStatusEnum.waiting,
      });

      // Assert
      expect(transactionEventsService.createEvent).toHaveBeenCalledWith({
        context,
        description:
          TransactionEventDescription.intersolveVoucherInitialMessageSent,
        errorMessage: undefined,
      });
    });

    it('should create an event when an error status was set', async () => {
      // Arrange
      transactionRepository.updateStatusUnlessIn.mockResolvedValue(true);

      // Act
      await transactionsService.saveProgressUnlessTransactionFailed({
        context,
        description:
          TransactionEventDescription.intersolveVoucherInitialMessageSent,
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'send failed',
      });

      // Assert
      expect(transactionRepository.updateStatusUnlessIn).toHaveBeenCalledWith({
        transactionId: context.transactionId,
        newTransactionStatus: TransactionStatusEnum.error,
        excludedStatuses: [TransactionStatusEnum.error],
      });
      expect(transactionEventsService.createEvent).toHaveBeenCalledWith({
        context,
        description:
          TransactionEventDescription.intersolveVoucherInitialMessageSent,
        errorMessage: 'send failed',
      });
    });
  });
});
