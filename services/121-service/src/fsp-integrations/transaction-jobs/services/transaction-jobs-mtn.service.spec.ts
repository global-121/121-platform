import { TestBed } from '@automock/jest';

import { MtnTransferResult } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-result.enum';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnRequestIdentity } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-request-identity.interface';
import { MtnService } from '@121-service/src/fsp-integrations/integrations/mtn/mtn.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsMtnService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-mtn.service';
import { MtnTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/mtn-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';

jest.mock('@121-service/src/env', () => ({
  env: {},
}));

jest.mock('@121-service/src/ormconfig', () => ({
  ormConfig: {},
}));

jest.mock('@121-service/src/appdatasource', () => ({
  AppDataSource: {},
}));

const testRequestIdentity: MtnRequestIdentity = {
  subscriptionKey: 'test-subscription-key',
  referenceId: 'test-reference-id',
  apiKey: 'test-api-key',
};

const mockTransactionJob: MtnTransactionJobDto = {
  referenceId: 'ref-1',
  transactionId: 1,
  programId: 1,
  userId: 1,
  bulkSize: 10,
  transferValue: 100,
  programFspConfigurationId: 1,
  isRetry: false,
  phoneNumberPayment: '256771234567',
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
    (mtnService.generateMtnReferenceId as jest.Mock).mockImplementation(
      ({
        referenceId,
        transactionId,
        failedTransactionAttempts,
      }: {
        referenceId: string;
        transactionId: number;
        failedTransactionAttempts: number;
      }) => `${referenceId}-${transactionId}-${failedTransactionAttempts}`,
    );
    jest.spyOn(programRepository, 'findOneOrFail').mockResolvedValue({
      currency: 'UGX',
    } as any);
    (mtnService.getMtnFspConfig as jest.Mock).mockResolvedValue(
      testRequestIdentity,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log transaction job start and call createTransfer on success', async () => {
    (mtnService.createTransfer as jest.Mock).mockResolvedValue(undefined);
    (mtnService.getTransfer as jest.Mock).mockResolvedValue({
      status: 'SUCCESSFUL',
    });
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

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
      phoneNumberPayment: '256771234567',
      transactionId: 1,
      requestIdentity: testRequestIdentity,
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

  it('should call getTransfer and save success when duplicate with SUCCESSFUL status', async () => {
    (mtnService.createTransfer as jest.Mock).mockRejectedValue(
      new MtnApiError({
        type: MtnTransferResult.duplicate,
        message: 'Duplicate transfer request',
      }),
    );
    (mtnService.getTransfer as jest.Mock).mockResolvedValue({
      status: 'SUCCESSFUL',
    });
    (mtnService.mapMtnStatusToTransactionStatus as jest.Mock).mockReturnValue(
      TransactionStatusEnum.success,
    );

    await service.processTransactionJob(mockTransactionJob);

    expect(mtnService.getTransfer).toHaveBeenCalledWith({
      mtnReferenceId: expect.any(String),
      requestIdentity: testRequestIdentity,
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

  it('should call getTransfer and save waiting when duplicate with PENDING status', async () => {
    (mtnService.createTransfer as jest.Mock).mockRejectedValue(
      new MtnApiError({
        type: MtnTransferResult.duplicate,
        message: 'Duplicate transfer request',
      }),
    );
    (mtnService.getTransfer as jest.Mock).mockResolvedValue({
      status: 'PENDING',
    });
    (mtnService.mapMtnStatusToTransactionStatus as jest.Mock).mockReturnValue(
      TransactionStatusEnum.waiting,
    );

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

  it('should call getTransfer and save error when duplicate with FAILED status', async () => {
    (mtnService.createTransfer as jest.Mock).mockRejectedValue(
      new MtnApiError({
        type: MtnTransferResult.duplicate,
        message: 'Duplicate transfer request',
      }),
    );
    (mtnService.getTransfer as jest.Mock).mockResolvedValue({
      status: 'FAILED',
      reason: 'Insufficient funds',
    });
    (mtnService.mapMtnStatusToTransactionStatus as jest.Mock).mockReturnValue(
      TransactionStatusEnum.error,
    );

    await service.processTransactionJob(mockTransactionJob);

    expect(transactionsService.saveProgress).toHaveBeenCalledWith({
      context: {
        transactionId: mockTransactionJob.transactionId,
        userId: mockTransactionJob.userId,
        programFspConfigurationId: mockTransactionJob.programFspConfigurationId,
      },
      description: TransactionEventDescription.mtnRequestSent,
      newTransactionStatus: TransactionStatusEnum.error,
      errorMessage: 'Insufficient funds',
    });
  });

  it('should generate different referenceIds for payment retry (different failedAttempts count)', async () => {
    (mtnService.createTransfer as jest.Mock).mockResolvedValue(undefined);
    (mtnService.getTransfer as jest.Mock).mockResolvedValue({
      status: 'SUCCESSFUL',
    });
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

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
    (mtnService.getTransfer as jest.Mock).mockResolvedValue({
      status: 'SUCCESSFUL',
    });
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

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
