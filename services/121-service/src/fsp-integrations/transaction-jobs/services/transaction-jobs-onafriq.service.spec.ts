import { OnafriqTransactionEntity } from '@121-service/src/fsp-integrations/integrations/onafriq/entities/onafriq-transaction.entity';
import { OnafriqService } from '@121-service/src/fsp-integrations/integrations/onafriq/services/onafriq.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsOnafriqService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-onafriq.service';
import { OnafriqTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/onafriq-transaction-job.dto';
import { FspConfigurationProperties } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';

describe('TransactionJobsOnafriqService', () => {
  let service: TransactionJobsOnafriqService;
  let onafriqService: jest.Mocked<OnafriqService>;
  let onafriqTransactionScopedRepository: jest.Mocked<
    ScopedRepository<OnafriqTransactionEntity>
  >;
  let transactionEventsScopedRepository: jest.Mocked<TransactionEventsScopedRepository>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;
  let programFspConfigurationRepository: jest.Mocked<ProgramFspConfigurationRepository>;
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
      saveTransactionProgressAndUpdateRegistration: jest.fn(),
    } as any;
    programFspConfigurationRepository = {
      getPropertiesByNamesOrThrow: jest.fn(),
    } as any;
    transactionsService = { updateTransactionStatus: jest.fn() } as any;

    service = new TransactionJobsOnafriqService(
      onafriqService,
      onafriqTransactionScopedRepository,
      transactionJobsHelperService,
      programFspConfigurationRepository,
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
        transferValue: 100,
        programFspConfigurationId: 1,
        isRetry: false,
        phoneNumberPayment: '123',
        firstName: 'John',
        lastName: 'Doe',
      };
      const mockCorporateCode = 'mocked_corporate_code';
      const mockPassword = 'mocked_password';
      const mockUniqueKey = 'mocked_unique_key';

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
        programFspConfigurationRepository.getPropertiesByNamesOrThrow as jest.Mock
      ).mockResolvedValue([
        {
          name: FspConfigurationProperties.corporateCodeOnafriq,
          value: mockCorporateCode,
        },
        {
          name: FspConfigurationProperties.passwordOnafriq,
          value: mockPassword,
        },
        {
          name: FspConfigurationProperties.uniqueKeyOnafriq,
          value: mockUniqueKey,
        },
      ]);

      await service.processOnafriqTransactionJob(transactionJob);

      expect(
        transactionJobsHelperService.createInitiatedOrRetryTransactionEvent,
      ).toHaveBeenCalled();
      expect(onafriqTransactionScopedRepository.save).not.toHaveBeenCalled();
      expect(onafriqTransactionScopedRepository.update).toHaveBeenCalled();
      expect(onafriqService.createTransaction).toHaveBeenCalledWith({
        transferValue: 100,
        phoneNumberPayment: '123',
        firstName: 'John',
        lastName: 'Doe',
        thirdPartyTransId: expect.any(String),
        requestIdentity: {
          corporateCode: mockCorporateCode,
          password: mockPassword,
          uniqueKey: mockUniqueKey,
        },
      });
    });
  });
});
