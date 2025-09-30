import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsSafaricomService } from '@121-service/src/transaction-jobs/services/transaction-jobs-safaricom.service';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';

const mockedSafaricomTransactionJob: SafaricomTransactionJobDto = {
  programId: 3,
  transactionId: 3,
  referenceId: 'ref-123',
  transactionAmount: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 10,
  phoneNumber: '254708374149',
  idNumber: 'nat-123',
  programFspConfigurationId: 1,
};

describe('TransactionJobsSafaricomService', () => {
  let service: TransactionJobsSafaricomService;
  let safaricomService: SafaricomService;
  let safaricomTransferScopedRepository: SafaricomTransferScopedRepository;
  let transactionEventsScopedRepository: TransactionEventsScopedRepository;
  let transactionJobsHelperService: TransactionJobsHelperService;
  let transactionsService: TransactionsService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsSafaricomService,
    ).compile();

    service = unit;
    safaricomService = unitRef.get<SafaricomService>(SafaricomService);
    safaricomTransferScopedRepository =
      unitRef.get<SafaricomTransferScopedRepository>(
        SafaricomTransferScopedRepository,
      );

    transactionEventsScopedRepository =
      unitRef.get<TransactionEventsScopedRepository>(
        TransactionEventsScopedRepository,
      );
    transactionJobsHelperService = unitRef.get<TransactionJobsHelperService>(
      TransactionJobsHelperService,
    );
    transactionsService = unitRef.get<TransactionsService>(TransactionsService);

    jest
      .spyOn(
        transactionJobsHelperService,
        'createInitiatedOrRetryTransactionEvent',
      )
      .mockImplementation();
    jest
      .spyOn(safaricomTransferScopedRepository, 'findOne')
      .mockResolvedValue(undefined);
    jest
      .spyOn(safaricomTransferScopedRepository, 'update')
      .mockResolvedValue({} as UpdateResult);
    jest
      .spyOn(safaricomTransferScopedRepository, 'save')
      .mockImplementation(async (entity) => ({ ...entity, id: 1 }));
    jest
      .spyOn(
        transactionEventsScopedRepository,
        'countFailedTransactionAttempts',
      )
      .mockResolvedValue(0);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('[Idempotency] safaricom transaction job processing should fail when using same originatorConversationId', async () => {
    const idempotencyError = new SafaricomApiError(
      '500.002.1001 - Duplicate OriginatorConversationID.',
    );

    jest
      .spyOn(safaricomService, 'doTransfer')
      .mockRejectedValueOnce(idempotencyError);

    jest
      .spyOn(
        transactionEventsScopedRepository,
        'countFailedTransactionAttempts',
      )
      .mockResolvedValueOnce(0);

    // Call the service method
    await service.processSafaricomTransactionJob(mockedSafaricomTransactionJob);

    expect(
      transactionJobsHelperService.createInitiatedOrRetryTransactionEvent,
    ).toHaveBeenCalled();
    expect(safaricomService.doTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        transferAmount: mockedSafaricomTransactionJob.transactionAmount,
        phoneNumber: mockedSafaricomTransactionJob.phoneNumber,
        idNumber: mockedSafaricomTransactionJob.idNumber,
        originatorConversationId: expect.any(String),
      }),
    );
    expect(transactionsService.saveTransactionProgress).toHaveBeenCalled();
  });
});
