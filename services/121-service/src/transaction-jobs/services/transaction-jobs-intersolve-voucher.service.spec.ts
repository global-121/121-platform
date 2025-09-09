import { TestBed } from '@automock/jest';

import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsIntersolveVoucherService } from '@121-service/src/transaction-jobs/services/transaction-jobs-intersolve-voucher.service';
import { IntersolveVoucherTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-voucher-transaction-job.dto';

const mockedIntersolveVoucherTransactionJob: IntersolveVoucherTransactionJobDto =
  {
    programId: 3,
    paymentId: 3,
    referenceId: 'ref-123',
    transactionAmount: 25,
    isRetry: false,
    userId: 1,
    bulkSize: 10,
    phoneNumber: '27831234567',
    programFspConfigurationId: 1,
    useWhatsapp: true,
    whatsappPhoneNumber: '27831234567',
  };

describe('TransactionJobsIntersolveVoucherService', () => {
  let service: TransactionJobsIntersolveVoucherService;
  let intersolveVoucherService: jest.Mocked<IntersolveVoucherService>;
  let programFspConfigurationRepository: jest.Mocked<ProgramFspConfigurationRepository>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;

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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processIntersolveVoucherTransactionJob', () => {
    it('should process intersolveVoucherTransactionJob successfully', async () => {
      (
        transactionJobsHelperService.getRegistrationOrThrow as jest.Mock
      ).mockResolvedValue({ id: 10 });
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
        transactionJobsHelperService.getRegistrationOrThrow,
      ).toHaveBeenCalledWith(mockedIntersolveVoucherTransactionJob.referenceId);
      expect(intersolveVoucherService.sendIndividualPayment).toHaveBeenCalled();
      expect(
        transactionJobsHelperService.createTransactionAndUpdateRegistration,
      ).toHaveBeenCalled();
    });
  });
});
