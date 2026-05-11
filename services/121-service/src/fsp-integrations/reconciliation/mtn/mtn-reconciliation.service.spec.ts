import { TestBed } from '@automock/jest';
import { Queue } from 'bull';

import { MtnTransferStatus } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-status.enum';
import { MtnReconciliationService } from '@121-service/src/fsp-integrations/reconciliation/mtn/mtn-reconciliation.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';

describe('MtnReconciliationService', () => {
  let mtnReconciliationService: MtnReconciliationService;
  let transactionsService: jest.Mocked<TransactionsService>;
  let queuesRegistryService: jest.Mocked<QueuesRegistryService>;
  let mockMtnTransferCallbackQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    mockMtnTransferCallbackQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    } as any;

    const { unit, unitRef } = TestBed.create(
      MtnReconciliationService,
    ).compile();

    mtnReconciliationService = unit;
    transactionsService = unitRef.get(TransactionsService);
    queuesRegistryService = unitRef.get(QueuesRegistryService);

    (queuesRegistryService as any).mtnTransferCallbackQueue =
      mockMtnTransferCallbackQueue;
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
    it('should update transaction to success when MTN status is SUCCESSFUL', async () => {
      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
        referenceId: 'ref-uuid-123',
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

    it('should update transaction to error when MTN status is FAILED', async () => {
      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
        referenceId: 'ref-uuid-123',
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

    it('should update transaction to error with unknown reason when FAILED without reason', async () => {
      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
        referenceId: 'ref-uuid-123',
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

    it('should treat unknown statuses as error', async () => {
      await mtnReconciliationService.processMtnTransferCallbackJob({
        transactionId: 42,
        referenceId: 'ref-uuid-123',
        status: 'UNEXPECTED_STATUS' as MtnTransferStatus,
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
  });
});
