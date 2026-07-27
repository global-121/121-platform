import { TestBed } from '@automock/jest';

import { PaymentsDeletionService } from '@121-service/src/payments/services/payments-deletion.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { QueuesRegistryService } from '@121-service/src/queues-registry/queues-registry.service';
import { JobNames } from '@121-service/src/shared/enum/job-names.enum';
import { AzureLogService } from '@121-service/src/shared/services/azure-log.service';

describe('PaymentsDeletionService', () => {
  let service: PaymentsDeletionService;
  let transactionsService: TransactionsService;
  let queuesRegistryService: QueuesRegistryService;
  let azureLogService: AzureLogService;
  let addMock: jest.Mock;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(PaymentsDeletionService).compile();
    service = unit;
    transactionsService = unitRef.get(TransactionsService);
    queuesRegistryService = unitRef.get(QueuesRegistryService);
    azureLogService = unitRef.get(AzureLogService);

    addMock = jest.fn().mockResolvedValue(undefined);
    (queuesRegistryService as any).paymentDeletionQueue = { add: addMock };
    (service as any).paymentRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('addPaymentDeletionJobToQueue', () => {
    it('should add a job using the paymentId as the deterministic jobId', async () => {
      // Act
      await service.addPaymentDeletionJobToQueue({ paymentId: 7 });

      // Assert
      expect(addMock).toHaveBeenCalledWith(
        JobNames.default,
        { paymentId: 7 },
        expect.objectContaining({ jobId: 7 }),
      );
    });
  });

  describe('processPaymentDeletionJob', () => {
    it('should delete the transactions before deleting the payment', async () => {
      // Arrange
      const callOrder: string[] = [];
      (
        transactionsService.deleteTransactionsByPaymentId as jest.Mock
      ).mockImplementation(async () => {
        callOrder.push('transactions');
      });
      ((service as any).paymentRepository.delete as jest.Mock).mockImplementation(
        async () => {
          callOrder.push('payment');
        },
      );

      // Act
      await service.processPaymentDeletionJob({ paymentId: 7 });

      // Assert
      expect(
        transactionsService.deleteTransactionsByPaymentId,
      ).toHaveBeenCalledWith({ paymentId: 7 });
      expect((service as any).paymentRepository.delete).toHaveBeenCalled();
      expect(callOrder).toEqual(['transactions', 'payment']);
    });

    it('should log and rethrow when cleanup fails', async () => {
      // Arrange
      const error = new Error('boom');
      (
        transactionsService.deleteTransactionsByPaymentId as jest.Mock
      ).mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.processPaymentDeletionJob({ paymentId: 7 }),
      ).rejects.toThrow('boom');
      expect(azureLogService.logError).toHaveBeenCalled();
    });
  });
});
