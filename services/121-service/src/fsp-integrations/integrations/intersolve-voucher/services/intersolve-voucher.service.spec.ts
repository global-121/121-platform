import { TestBed } from '@automock/jest';

import { IntersolveVoucherService } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/services/intersolve-voucher.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

const mockTransactionId = 1;
const mockUserId = 2;
const mockProgramFspConfigurationId = 3;

describe('IntersolveVoucherService', () => {
  let service: IntersolveVoucherService;
  let transactionsService: jest.Mocked<TransactionsService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(IntersolveVoucherService)
      .compile();

    service = unit;
    transactionsService = unitRef.get(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateTransactionProgressBasedOnInitialMessage', () => {
    it('should atomically save waiting progress unless a callback has resolved the transaction', async () => {
      // Act
      await service.updateTransactionProgressBasedOnInitialMessage({
        transactionId: mockTransactionId,
        newTransactionStatus: TransactionStatusEnum.waiting,
        userId: mockUserId,
        programFspConfigurationId: mockProgramFspConfigurationId,
      });

      // Assert
      expect(
        transactionsService.saveProgressUnlessTransactionFailed,
      ).toHaveBeenCalledWith({
        context: {
          transactionId: mockTransactionId,
          userId: mockUserId,
          programFspConfigurationId: mockProgramFspConfigurationId,
        },
        description:
          TransactionEventDescription.intersolveVoucherInitialMessageSent,
        newTransactionStatus: TransactionStatusEnum.waiting,
        errorMessage: undefined,
      });
    });

    it('should atomically save an error status unless a callback has already resolved the transaction', async () => {
      // Act
      await service.updateTransactionProgressBasedOnInitialMessage({
        transactionId: mockTransactionId,
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'send failed',
        userId: mockUserId,
        programFspConfigurationId: mockProgramFspConfigurationId,
      });

      // Assert
      expect(
        transactionsService.saveProgressUnlessTransactionFailed,
      ).toHaveBeenCalledWith({
        context: {
          transactionId: mockTransactionId,
          userId: mockUserId,
          programFspConfigurationId: mockProgramFspConfigurationId,
        },
        description:
          TransactionEventDescription.intersolveVoucherInitialMessageSent,
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'send failed',
      });
    });
  });
});
