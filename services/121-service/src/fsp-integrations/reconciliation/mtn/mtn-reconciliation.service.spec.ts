import { TestBed } from '@automock/jest';
import { Queue } from 'bull';

import { MtnTransferStatus } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-status.enum';
import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { MtnReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.service';
import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
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
  let programFspConfigurationRepository: jest.Mocked<ProgramFspConfigurationRepository>;
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
    programFspConfigurationRepository = unitRef.get(
      ProgramFspConfigurationRepository,
    );

    (queuesRegistryService as any).mtnTransferCallbackQueue =
      mockMtnTransferCallbackQueue;

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
      mtnService.mapMtnStatusToTransactionStatus as jest.Mock
    ).mockImplementation(({ mtnStatus }: { mtnStatus: string }) => {
      switch (mtnStatus) {
        case MtnTransferStatus.successful:
          return TransactionStatusEnum.success;
        case MtnTransferStatus.pending:
          return TransactionStatusEnum.waiting;
        case MtnTransferStatus.failed:
          return TransactionStatusEnum.error;
        default:
          return TransactionStatusEnum.error;
      }
    });
    (
      transactionEventsScopedRepository.findLatestEventByTransactionId as jest.Mock
    ).mockResolvedValue({ programFspConfigurationId: 1 });
    (
      programFspConfigurationRepository.getPropertiesByNamesOrThrow as jest.Mock
    ).mockResolvedValue([
      {
        name: FspConfigurationProperties.subscriptionKeyMtn,
        value: 'test-subscription-key',
      },
      {
        name: FspConfigurationProperties.referenceIdMtn,
        value: 'test-reference-id',
      },
      {
        name: FspConfigurationProperties.apiKeyMtn,
        value: 'test-api-key',
      },
    ]);
  });

  describe('processTransferCallback', () => {
    it('should enqueue a callback job with the correct data', async () => {
      await mtnReconciliationService.processTransferCallback({
        externalId: '42',
        referenceId: 'ref-uuid-123',
        status: MtnTransferStatus.successful,
        reason: undefined,
      });

      expect(mockMtnTransferCallbackQueue.add).toHaveBeenCalledWith(
        JobNames.default,
        {
          transactionId: 42,
          referenceId: 'ref-uuid-123',
          status: MtnTransferStatus.successful,
          reason: undefined,
        },
      );
    });

    it('should pass the reason when provided', async () => {
      await mtnReconciliationService.processTransferCallback({
        externalId: '99',
        referenceId: 'ref-uuid-456',
        status: MtnTransferStatus.failed,
        reason: 'PAYER_NOT_FOUND',
      });

      expect(mockMtnTransferCallbackQueue.add).toHaveBeenCalledWith(
        JobNames.default,
        {
          transactionId: 99,
          referenceId: 'ref-uuid-456',
          status: MtnTransferStatus.failed,
          reason: 'PAYER_NOT_FOUND',
        },
      );
    });

    it('should default referenceId to empty string when not provided', async () => {
      await mtnReconciliationService.processTransferCallback({
        externalId: '42',
        status: MtnTransferStatus.successful,
      });

      expect(mockMtnTransferCallbackQueue.add).toHaveBeenCalledWith(
        JobNames.default,
        {
          transactionId: 42,
          referenceId: '',
          status: MtnTransferStatus.successful,
          reason: undefined,
        },
      );
    });

    it('should drop callback when externalId is missing', async () => {
      await mtnReconciliationService.processTransferCallback({
        status: MtnTransferStatus.successful,
      });

      expect(mockMtnTransferCallbackQueue.add).not.toHaveBeenCalled();
    });

    it('should drop callback when status is missing', async () => {
      await mtnReconciliationService.processTransferCallback({
        externalId: '42',
      });

      expect(mockMtnTransferCallbackQueue.add).not.toHaveBeenCalled();
    });

    it('should drop callback when externalId is not numeric', async () => {
      await mtnReconciliationService.processTransferCallback({
        externalId: 'not-a-number',
        status: MtnTransferStatus.successful,
      });

      expect(mockMtnTransferCallbackQueue.add).not.toHaveBeenCalled();
    });

    it('should still enqueue callback with unknown status value', async () => {
      await mtnReconciliationService.processTransferCallback({
        externalId: '42',
        status: 'UNKNOWN_STATUS',
      });

      expect(mockMtnTransferCallbackQueue.add).toHaveBeenCalledWith(
        JobNames.default,
        {
          transactionId: 42,
          referenceId: '',
          status: 'UNKNOWN_STATUS',
          reason: undefined,
        },
      );
    });
  });

  describe('processMtnTransferCallbackJob', () => {
    it('should regenerate mtnReferenceId and call MTN API to verify status', async () => {
      (mtnService.getTransferStatus as jest.Mock).mockResolvedValue({
        status: MtnTransferStatus.successful,
      });

      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
        referenceId: 'callback-ref-uuid',
        status: MtnTransferStatus.successful,
      });

      expect(
        transactionRepository.getReferenceIdByTransactionIdOrThrow,
      ).toHaveBeenCalledWith(42);
      expect(
        transactionEventsScopedRepository.countFailedTransactionAttempts,
      ).toHaveBeenCalledWith(42);
      expect(mtnService.generateMtnReferenceId).toHaveBeenCalledWith({
        referenceId: 'registration-ref-id',
        transactionId: 42,
        failedTransactionAttempts: 0,
      });
      expect(mtnService.getTransferStatus).toHaveBeenCalledWith({
        mtnReferenceId: 'generated-mtn-reference-id',
        requestIdentity: {
          subscriptionKey: 'test-subscription-key',
          referenceId: 'test-reference-id',
          apiKey: 'test-api-key',
        },
      });
    });

    it('should update transaction to success when MTN API returns SUCCESSFUL', async () => {
      (mtnService.getTransferStatus as jest.Mock).mockResolvedValue({
        status: MtnTransferStatus.successful,
      });

      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
        referenceId: 'callback-ref-uuid',
        status: MtnTransferStatus.successful,
      });

      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledWith({
        transactionId: 42,
        description: TransactionEventDescription.mtnCallbackReceived,
        newTransactionStatus: TransactionStatusEnum.success,
        errorMessage: undefined,
      });
    });

    it('should update transaction to error when MTN API returns FAILED', async () => {
      (mtnService.getTransferStatus as jest.Mock).mockResolvedValue({
        status: MtnTransferStatus.failed,
        reason: 'PAYER_NOT_FOUND',
      });

      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
        referenceId: 'callback-ref-uuid',
        status: MtnTransferStatus.failed,
        reason: 'PAYER_NOT_FOUND',
      });

      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledWith({
        transactionId: 42,
        description: TransactionEventDescription.mtnCallbackReceived,
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'PAYER_NOT_FOUND',
      });
    });

    it('should use unknown as error message when MTN API returns FAILED without reason', async () => {
      (mtnService.getTransferStatus as jest.Mock).mockResolvedValue({
        status: MtnTransferStatus.failed,
      });

      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
        referenceId: 'callback-ref-uuid',
        status: MtnTransferStatus.failed,
      });

      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledWith({
        transactionId: 42,
        description: TransactionEventDescription.mtnCallbackReceived,
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'unknown',
      });
    });

    it('should use MTN API status even when callback status differs', async () => {
      (mtnService.getTransferStatus as jest.Mock).mockResolvedValue({
        status: MtnTransferStatus.failed,
        reason: 'INTERNAL_ERROR',
      });

      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
        referenceId: 'callback-ref-uuid',
        status: MtnTransferStatus.successful,
      });

      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledWith({
        transactionId: 42,
        description: TransactionEventDescription.mtnCallbackReceived,
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'INTERNAL_ERROR',
      });
    });

    it('should update transaction to waiting when MTN API returns PENDING', async () => {
      (mtnService.getTransferStatus as jest.Mock).mockResolvedValue({
        status: MtnTransferStatus.pending,
      });

      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
        referenceId: 'callback-ref-uuid',
        status: MtnTransferStatus.pending,
      });

      expect(
        transactionsService.saveProgressFromExternalSource,
      ).toHaveBeenCalledWith({
        transactionId: 42,
        description: TransactionEventDescription.mtnCallbackReceived,
        newTransactionStatus: TransactionStatusEnum.waiting,
        errorMessage: undefined,
      });
    });
  });
});
