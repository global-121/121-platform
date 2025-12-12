import { TestBed } from '@automock/jest';

import { IntersolveVoucherService } from '@121-service/src/fsp-integrations/integrations/intersolve-voucher/services/intersolve-voucher.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsIntersolveVoucherService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-intersolve-voucher.service';
import { IntersolveVoucherTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/intersolve-voucher-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

const mockedIntersolveVoucherTransactionJob: IntersolveVoucherTransactionJobDto =
  {
    programId: 3,
    transactionId: 3,
    referenceId: 'ref-123',
    transferValue: 25,
    isRetry: false,
    userId: 1,
    bulkSize: 10,
    programFspConfigurationId: 1,
    useWhatsapp: true,
    whatsappPhoneNumber: '27831234567',
  };

describe('TransactionJobsIntersolveVoucherService', () => {
  let service: TransactionJobsIntersolveVoucherService;
  let intersolveVoucherService: jest.Mocked<IntersolveVoucherService>;
  let programFspConfigurationRepository: jest.Mocked<ProgramFspConfigurationRepository>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;
  let transactionsService: jest.Mocked<TransactionsService>;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsIntersolveVoucherService,
    ).compile();

    service = unit;
    intersolveVoucherService = unitRef.get<IntersolveVoucherService>(
      IntersolveVoucherService,
    );
    programFspConfigurationRepository =
      unitRef.get<ProgramFspConfigurationRepository>(
        ProgramFspConfigurationRepository,
      );
    transactionJobsHelperService = unitRef.get<TransactionJobsHelperService>(
      TransactionJobsHelperService,
    );
    transactionsService = unitRef.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processIntersolveVoucherTransactionJob', () => {
    it('should process intersolveVoucherTransactionJob successfully', async () => {
      (
        programFspConfigurationRepository.getUsernamePasswordProperties as jest.Mock
      ).mockResolvedValue({ username: 'user', password: 'pass' });
      (
        intersolveVoucherService.sendIndividualPayment as jest.Mock
      ).mockResolvedValue({ status: TransactionStatusEnum.success });

      await service.processIntersolveVoucherTransactionJob(
        mockedIntersolveVoucherTransactionJob,
      );

      expect(
        transactionJobsHelperService.logTransactionJobStart,
      ).toHaveBeenCalled();
      expect(transactionsService.saveProgress).toHaveBeenCalled();
      expect(intersolveVoucherService.sendIndividualPayment).toHaveBeenCalled();
    });
  });
});
