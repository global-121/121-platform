import { OnafriqTransactionEntity } from '@121-service/src/payments/fsp-integration/onafriq/entities/onafriq-transaction.entity';
import { OnafriqService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.service';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
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
  let transactionScopedRepository: jest.Mocked<TransactionScopedRepository>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;

  beforeEach(async () => {
    onafriqService = { createTransaction: jest.fn() } as any;
    onafriqTransactionScopedRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as any;
    transactionScopedRepository = {
      count: jest.fn(),
      update: jest.fn(),
    } as any;
    transactionJobsHelperService = {
      getRegistrationOrThrow: jest.fn(),
      createTransactionAndUpdateRegistration: jest.fn(),
    } as any;

    service = new TransactionJobsOnafriqService(
      onafriqService,
      onafriqTransactionScopedRepository,
      transactionScopedRepository,
      transactionJobsHelperService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processOnafriqTransactionJob', () => {
    it('should use existing onafriqTransaction and not create a new one', async () => {
      const transactionJob: OnafriqTransactionJobDto = {
        referenceId: 'ref-1',
        paymentId: 1,
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
      const registration = { id: 10 };
      const existingOnafriqTransaction = { transactionId: 99 };
      (
        transactionJobsHelperService.getRegistrationOrThrow as jest.Mock
      ).mockResolvedValue(registration);
      (transactionScopedRepository.count as jest.Mock).mockResolvedValue(0);
      (
        onafriqTransactionScopedRepository.findOne as jest.Mock
      ).mockResolvedValue(existingOnafriqTransaction);
      (onafriqService.createTransaction as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.processOnafriqTransactionJob(transactionJob);

      expect(
        transactionJobsHelperService.createTransactionAndUpdateRegistration,
      ).not.toHaveBeenCalled();
      expect(onafriqTransactionScopedRepository.save).not.toHaveBeenCalled();
      expect(onafriqService.createTransaction).toHaveBeenCalledWith({
        transferAmount: 100,
        phoneNumber: '123',
        firstName: 'John',
        lastName: 'Doe',
        thirdPartyTransId: expect.any(String),
      });
    });
  });
});
