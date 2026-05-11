import { TestBed } from '@automock/jest';

import { MtnTransferResult } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-result.enum';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsMtnService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-mtn.service';
import { MtnTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/mtn-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';

const mockTransactionJob: MtnTransactionJobDto = {
  referenceId: 'ref-1',
  transactionId: 1,
  programId: 1,
  userId: 1,
  bulkSize: 10,
  transferValue: 100,
  programFspConfigurationId: 1,
  isRetry: false,
  phoneNumber: '256771234567',
};

describe('TransactionJobsMtnService', () => {
  let service: TransactionJobsMtnService;
  let mtnService: MtnService;
  let transactionEventsScopedRepository: TransactionEventsScopedRepository;
  let transactionJobsHelperService: TransactionJobsHelperService;
  let transactionsService: TransactionsService;
  let programRepository: ProgramRepository;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsMtnService,
    ).compile();

    service = unit;
    mtnService = unitRef.get<MtnService>(MtnService);
    transactionEventsScopedRepository =
      unitRef.get<TransactionEventsScopedRepository>(
        TransactionEventsScopedRepository,
      );
    transactionJobsHelperService = unitRef.get<TransactionJobsHelperService>(
      TransactionJobsHelperService,
    );
    transactionsService = unitRef.get<TransactionsService>(TransactionsService);
    programRepository = unitRef.get<ProgramRepository>(ProgramRepository);

    jest
      .spyOn(transactionJobsHelperService, 'logTransactionJobStart')
      .mockImplementation();
    jest.spyOn(transactionsService, 'saveProgress').mockImplementation();
    jest
      .spyOn(
        transactionEventsScopedRepository,
        'countFailedTransactionAttempts',
      )
      .mockResolvedValue(0);
    jest.spyOn(programRepository, 'findByIdOrFail').mockResolvedValue({
      currency: 'UGX',
    } as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log transaction job start and call createTransfer on success', async () => {
    (mtnService.createTransfer as jest.Mock).mockResolvedValue(undefined);

    await service.processTransactionJob(mockTransactionJob);

    expect(
      transactionJobsHelperService.logTransactionJobStart,
    ).toHaveBeenCalledWith({
      context: {
        transactionId: mockTransactionJob.transactionId,
        userId: mockTransactionJob.userId,
        programFspConfigurationId: mockTransactionJob.programFspConfigurationId,
      },
      isRetry: false,
    });
    expect(mtnService.createTransfer).toHaveBeenCalledWith({
      mtnReferenceId: expect.any(String),
      amount: '100',
      currency: 'UGX',
      externalId: '1',
      phoneNumber: '256771234567',
      transactionId: 1,
    });
    expect(transactionsService.saveProgress).toHaveBeenCalledWith({
      context: {
        transactionId: mockTransactionJob.transactionId,
        userId: mockTransactionJob.userId,
        programFspConfigurationId: mockTransactionJob.programFspConfigurationId,
      },
      description: TransactionEventDescription.mtnRequestSent,
    });
  });

  it('should save error status when MtnApiError is thrown', async () => {
    (mtnService.createTransfer as jest.Mock).mockRejectedValue(
      new MtnApiError({
        type: MtnTransferResult.fail,
        message: 'Transfer failed',
      }),
    );

    await service.processTransactionJob(mockTransactionJob);

    expect(transactionsService.saveProgress).toHaveBeenCalledWith({
      context: {
        transactionId: mockTransactionJob.transactionId,
        userId: mockTransactionJob.userId,
        programFspConfigurationId: mockTransactionJob.programFspConfigurationId,
      },
      description: TransactionEventDescription.mtnRequestSent,
      errorMessage: expect.stringContaining('Transfer failed'),
      newTransactionStatus: TransactionStatusEnum.error,
    });
  });

  it('should call getTransferStatus and save success when duplicate with SUCCESSFUL status', async () => {
    (mtnService.createTransfer as jest.Mock).mockRejectedValue(
      new MtnApiError({
        type: MtnTransferResult.duplicate,
        message: 'Duplicate transfer request',
      }),
    );
    (mtnService.getTransferStatus as jest.Mock).mockResolvedValue({
      status: 'SUCCESSFUL',
    });

    await service.processTransactionJob(mockTransactionJob);

    expect(mtnService.getTransferStatus).toHaveBeenCalledWith({
      referenceId: expect.any(String),
    });
    expect(transactionsService.saveProgress).toHaveBeenCalledWith({
      context: {
        transactionId: mockTransactionJob.transactionId,
        userId: mockTransactionJob.userId,
        programFspConfigurationId: mockTransactionJob.programFspConfigurationId,
      },
      description: TransactionEventDescription.mtnRequestSent,
      newTransactionStatus: TransactionStatusEnum.success,
      errorMessage: undefined,
    });
  });

  it('should call getTransferStatus and save waiting when duplicate with PENDING status', async () => {
    (mtnService.createTransfer as jest.Mock).mockRejectedValue(
      new MtnApiError({
        type: MtnTransferResult.duplicate,
        message: 'Duplicate transfer request',
      }),
    );
    (mtnService.getTransferStatus as jest.Mock).mockResolvedValue({
      status: 'PENDING',
    });

    await service.processTransactionJob(mockTransactionJob);

    expect(transactionsService.saveProgress).toHaveBeenCalledWith({
      context: {
        transactionId: mockTransactionJob.transactionId,
        userId: mockTransactionJob.userId,
        programFspConfigurationId: mockTransactionJob.programFspConfigurationId,
      },
      description: TransactionEventDescription.mtnRequestSent,
      newTransactionStatus: TransactionStatusEnum.waiting,
      errorMessage: undefined,
    });
  });

  it('should call getTransferStatus and save error when duplicate with FAILED status', async () => {
    (mtnService.createTransfer as jest.Mock).mockRejectedValue(
      new MtnApiError({
        type: MtnTransferResult.duplicate,
        message: 'Duplicate transfer request',
      }),
    );
    (mtnService.getTransferStatus as jest.Mock).mockResolvedValue({
      status: 'FAILED',
      reason: 'Insufficient funds',
    });

    await service.processTransactionJob(mockTransactionJob);

    expect(transactionsService.saveProgress).toHaveBeenCalledWith({
      context: {
        transactionId: mockTransactionJob.transactionId,
        userId: mockTransactionJob.userId,
        programFspConfigurationId: mockTransactionJob.programFspConfigurationId,
      },
      description: TransactionEventDescription.mtnRequestSent,
      newTransactionStatus: TransactionStatusEnum.error,
      errorMessage: 'MTN transfer failed with reason: Insufficient funds',
    });
  });

  it('should generate different referenceIds for payment retry (different failedAttempts count)', async () => {
    (mtnService.createTransfer as jest.Mock).mockResolvedValue(undefined);

    // First call with 0 failed attempts
    await service.processTransactionJob(mockTransactionJob);
    const firstReferenceId = (mtnService.createTransfer as jest.Mock).mock
      .calls[0][0].mtnReferenceId;

    // Second call with 1 failed attempt (payment retry)
    (
      transactionEventsScopedRepository.countFailedTransactionAttempts as jest.Mock
    ).mockResolvedValue(1);
    await service.processTransactionJob({
      ...mockTransactionJob,
      isRetry: true,
    });
    const secondReferenceId = (mtnService.createTransfer as jest.Mock).mock
      .calls[1][0].mtnReferenceId;

    expect(firstReferenceId).not.toEqual(secondReferenceId);
  });

  it('should generate same referenceId for queue retry (same failedAttempts count)', async () => {
    (mtnService.createTransfer as jest.Mock).mockResolvedValue(undefined);

    await service.processTransactionJob(mockTransactionJob);
    const firstReferenceId = (mtnService.createTransfer as jest.Mock).mock
      .calls[0][0].mtnReferenceId;

    await service.processTransactionJob(mockTransactionJob);
    const secondReferenceId = (mtnService.createTransfer as jest.Mock).mock
      .calls[1][0].mtnReferenceId;

    expect(firstReferenceId).toEqual(secondReferenceId);
  });

  it('should rethrow unexpected errors', async () => {
    const unexpectedError = new Error('Unexpected');
    (mtnService.createTransfer as jest.Mock).mockRejectedValue(unexpectedError);

    await expect(
      service.processTransactionJob(mockTransactionJob),
    ).rejects.toThrow('Unexpected');
  });
});
