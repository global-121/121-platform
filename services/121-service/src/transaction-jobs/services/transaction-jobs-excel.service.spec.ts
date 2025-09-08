import { TestBed } from '@automock/jest';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionJobsExcelService } from '@121-service/src/transaction-jobs/services/transaction-jobs-excel.service';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { ExcelTransactionJobDto } from '@121-service/src/transaction-queues/dto/excel-transaction-job.dto';

const mockedRegistration = {
  id: 1,
  referenceId: 'ref-123',
  registrationStatus: 'active',
  paymentCount: 0,
  preferredLanguage: 'en',
} as any;

const mockedTransactionId = 1;

const mockedExcelTransactionJob: ExcelTransactionJobDto = {
  programId: 3,
  paymentId: 3,
  referenceId: 'ref-123',
  transactionAmount: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 10,
  phoneNumber: '27831234567',
  programFspConfigurationId: 1,
};

describe('TransactionJobsExcelService', () => {
  let service: TransactionJobsExcelService;
  let transactionJobsHelperService: TransactionJobsHelperService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsExcelService,
    ).compile();

    service = unit;
    transactionJobsHelperService = unitRef.get<TransactionJobsHelperService>(
      TransactionJobsHelperService,
    );

    jest
      .spyOn(transactionJobsHelperService, 'getRegistrationOrThrow')
      .mockResolvedValue(mockedRegistration);
    jest
      .spyOn(
        transactionJobsHelperService,
        'createTransactionAndUpdateRegistration',
      )
      .mockResolvedValue({ id: mockedTransactionId } as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process Excel transaction job successfully', async () => {
    await service.processExcelTransactionJob(mockedExcelTransactionJob);

    expect(
      transactionJobsHelperService.getRegistrationOrThrow,
    ).toHaveBeenCalledWith(mockedExcelTransactionJob.referenceId);
    expect(
      transactionJobsHelperService.createTransactionAndUpdateRegistration,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        registration: mockedRegistration,
        transactionJob: mockedExcelTransactionJob,
        transferAmountInMajorUnit: mockedExcelTransactionJob.transactionAmount,
        status: TransactionStatusEnum.waiting,
      }),
    );
  });
});
