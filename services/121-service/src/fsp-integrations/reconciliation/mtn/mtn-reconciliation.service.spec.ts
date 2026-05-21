import { TestBed } from '@automock/jest';
import { Queue } from 'bull';

import { MtnTransferStatus } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-status.enum';
import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { MtnReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

jest.mock('@121-service/src/env', () => ({
  env: {},
}));

jest.mock('@121-service/src/ormconfig', () => ({
  ormConfig: {},
}));

jest.mock('@121-service/src/appdatasource', () => ({
  AppDataSource: {},
}));

describe('MtnReconciliationService', () => {
  let mtnReconciliationService: MtnReconciliationService;
  let mtnService: jest.Mocked<MtnService>;
  let transactionsService: jest.Mocked<TransactionsService>;
  let queuesRegistryService: jest.Mocked<QueuesRegistryService>;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let transactionEventsScopedRepository: jest.Mocked<TransactionEventsScopedRepository>;
  let mockMtnTransferCallbackQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    mockMtnTransferCallbackQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    } as any;

    const { unit, unitRef } = TestBed.create(
      MtnReconciliationService,
    ).compile();

    mtnReconciliationService = unit;
    mtnService = unitRef.get(MtnService);
    transactionsService = unitRef.get(TransactionsService);
    queuesRegistryService = unitRef.get(QueuesRegistryService);
    transactionRepository = unitRef.get(TransactionRepository);
    transactionEventsScopedRepository = unitRef.get(
      TransactionEventsScopedRepository,
    );

    (queuesRegistryService as any).mtnTransferCallbackQueue =
      mockMtnTransferCallbackQueue;

    (transactionRepository.getStatusByIdOrThrow as jest.Mock).mockResolvedValue(
      TransactionStatusEnum.waiting,
    );
    (
      transactionRepository.getReferenceIdByTransactionIdOrThrow as jest.Mock
    ).mockResolvedValue('registration-ref-id');
    (
      transactionEventsScopedRepository.countFailedTransactionAttempts as jest.Mock
    ).mockResolvedValue(0);
    (mtnService.generateMtnReferenceId as jest.Mock).mockReturnValue(
      'generated-mtn-reference-id',
    );
    (
      transactionEventsScopedRepository.findLatestEventByTransactionId as jest.Mock
    ).mockResolvedValue({ programFspConfigurationId: 1 });
    (mtnService.getMtnFspConfig as jest.Mock).mockResolvedValue({
      subscriptionKey: 'test-subscription-key',
      referenceId: 'test-reference-id',
      apiKey: 'test-api-key',
    });
  });

  describe('processTransferCallback', () => {
    it('should enqueue a callback job with the correct data', async () => {
      // Act
      await mtnReconciliationService.processTransferCallback({
        externalId: '42',
        referenceId: 'ref-uuid-123',
        status: MtnTransferStatus.successful,
        reason: undefined,
      });

      // Assert
      expect(mockMtnTransferCallbackQueue.add).toHaveBeenCalledWith(
        JobNames.default,
        { transactionId: 42 },
      );
    });

    it('should drop callback when externalId is missing', async () => {
      // Act
      await mtnReconciliationService.processTransferCallback({
        status: MtnTransferStatus.successful,
      });

      // Assert
      expect(mockMtnTransferCallbackQueue.add).not.toHaveBeenCalled();
    });

    it('should drop callback when externalId is not numeric', async () => {
      // Act
      await mtnReconciliationService.processTransferCallback({
        externalId: 'not-a-number',
        status: MtnTransferStatus.successful,
      });

      // Assert
      expect(mockMtnTransferCallbackQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('processMtnTransferCallbackJob', () => {
    it('should skip processing if the transaction is not in waiting status', async () => {
      // Arrange
      (
        transactionRepository.getStatusByIdOrThrow as jest.Mock
      ).mockResolvedValue(TransactionStatusEnum.success);

      // Act
      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
      });

      // Assert
      expect(
        transactionsService.saveProgressFromExternalSource,
      ).not.toHaveBeenCalled();
    });

    it('should save transaction progress', async () => {
      // Arrange
      (mtnService.getTransfer as jest.Mock).mockResolvedValue({
        status: MtnTransferStatus.successful,
      });
      (mtnService.mapMtnStatusToTransactionStatus as jest.Mock).mockReturnValue(
        TransactionStatusEnum.success,
      );

      // Act
      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
      });

      // Assert
      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledWith({
        transactionId: 42,
        description: TransactionEventDescription.mtnCallbackReceived,
        newTransactionStatus: TransactionStatusEnum.success,
        errorMessage: undefined,
      });
    });
  });
});
