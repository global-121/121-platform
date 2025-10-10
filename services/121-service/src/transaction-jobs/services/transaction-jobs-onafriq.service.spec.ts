import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.service';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsOnafriqService } from '@121-service/src/transaction-jobs/services/transaction-jobs-onafriq.service';
import { OnafriqTransactionJobDto } from '@121-service/src/transaction-queues/dto/onafriq-transaction-job.dto';

describe('TransactionJobsOnafriqService', () => {
  let service: TransactionJobsOnafriqService;
  let onafriqService: jest.Mocked<OnafriqService>;
  let onafriqTransactionScopedRepository: jest.Mocked<
    ScopedRepository<OnafriqTransactionEntity>
  >;
  let transactionEventsScopedRepository: jest.Mocked<TransactionEventsScopedRepository>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;
  let transactionsService: jest.Mocked<TransactionsService>;

  beforeEach(async () => {
    onafriqService = { createTransaction: jest.fn() } as any;
    onafriqTransactionScopedRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;
    transactionEventsScopedRepository = {
      countFailedTransactionAttempts: jest.fn(),
    } as any;
    transactionJobsHelperService = {
      createInitiatedOrRetryTransactionEvent: jest.fn(),
    } as any;
    transactionsService = {
      saveTransactionProgress: jest.fn(),
    } as any;

    service = new TransactionJobsOnafriqService(
      onafriqService,
      onafriqTransactionScopedRepository,
      transactionJobsHelperService,
      transactionEventsScopedRepository,
      transactionsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processOnafriqTransactionJob', () => {
    it('should use existing onafriqTransaction and not create a new one when existing transaction is found', async () => {
      const transactionJob: OnafriqTransactionJobDto = {
        referenceId: 'ref-1',
        transactionId: 1,
        programId: 1,
        userId: 1,
        bulkSize: 10,
        transactionAmount: 100,
        programFspConfigurationId: 1,
        isRetry: false,
        phoneNumberPayment: '123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const existingOnafriqTransaction = { transactionId: 99 };
      (
        transactionJobsHelperService.createInitiatedOrRetryTransactionEvent as jest.Mock
      ).mockImplementation();
      (
        transactionEventsScopedRepository.countFailedTransactionAttempts as jest.Mock
      ).mockResolvedValue(0);
      (
        onafriqTransactionScopedRepository.findOne as jest.Mock
      ).mockResolvedValue(existingOnafriqTransaction);
      (onafriqService.createTransaction as jest.Mock).mockResolvedValue(
        undefined,
      );
      (
        transactionsService.saveTransactionProgress as jest.Mock
      ).mockImplementation();

      await service.processOnafriqTransactionJob(transactionJob);

      expect(
        transactionJobsHelperService.createInitiatedOrRetryTransactionEvent,
      ).toHaveBeenCalled();
      expect(onafriqTransactionScopedRepository.save).not.toHaveBeenCalled();
      expect(onafriqTransactionScopedRepository.update).toHaveBeenCalled();
      expect(onafriqService.createTransaction).toHaveBeenCalledWith({
        transferAmount: 100,
        phoneNumberPayment: '123',
        firstName: 'John',
        lastName: 'Doe',
        thirdPartyTransId: expect.any(String),
      });
    });
  });
});
