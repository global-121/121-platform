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
  let mockMtnTransferReconciliationQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    mockMtnTransferReconciliationQueue = {
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

    (queuesRegistryService as any).mtnTransferReconciliationQueue =
      mockMtnTransferReconciliationQueue;

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
    (
      transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
    ).mockResolvedValue([]);
  });

  describe('doMtnReconciliation', () => {
    it('should enqueue each waiting transaction with a deterministic jobId and return the count', async () => {
      // Arrange
      (
        transactionRepository.getWaitingTransactionIdsByFsp as jest.Mock
      ).mockResolvedValue([42, 43]);

      // Act
      const count = await mtnReconciliationService.doMtnReconciliation();

      // Assert
      expect(mockMtnTransferReconciliationQueue.add).toHaveBeenCalledTimes(2);
      expect(mockMtnTransferReconciliationQueue.add).toHaveBeenCalledWith(
        JobNames.default,
        { transactionId: 42 },
        { jobId: 42 },
      );
      expect(mockMtnTransferReconciliationQueue.add).toHaveBeenCalledWith(
        JobNames.default,
        { transactionId: 43 },
        { jobId: 43 },
      );
      expect(count).toBe(2);
    });
  });

  describe('processMtnTransferReconciliationJob', () => {
    it('should skip processing if the transaction is not in waiting status', async () => {
      // Arrange
      (
        transactionRepository.getStatusByIdOrThrow as jest.Mock
      ).mockResolvedValue(TransactionStatusEnum.success);

      // Act
      await mtnReconciliationService.processMtnTransferReconciliationJob({
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
      await mtnReconciliationService.processMtnTransferReconciliationJob({
        transactionId: 42,
      });

      // Assert
      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledWith({
        transactionId: 42,
        description: TransactionEventDescription.mtnReconciliationProcessed,
        newTransactionStatus: TransactionStatusEnum.success,
        errorMessage: undefined,
      });
    });
  });
});
