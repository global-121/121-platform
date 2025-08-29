import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';
import { SafaricomTransferScopedRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsSafaricomService } from '@121-service/src/transaction-jobs/services/transaction-jobs-safaricom.service';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';

const mockedRegistration = {
  id: 1,
  referenceId: 'ref-123',
  registrationStatus: 'active',
  paymentCount: 0,
  preferredLanguage: 'en',
} as any;

const mockedTransactionId = 1;

const mockedSafaricomTransactionJob: SafaricomTransactionJobDto = {
  projectId: 3,
  paymentId: 3,
  referenceId: 'ref-123',
  transactionAmount: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 10,
  phoneNumber: '254708374149',
  idNumber: 'nat-123',
  projectFspConfigurationId: 1,
  originatorConversationId: 'originator-conversation-id',
};

describe('TransactionJobsSafaricomService', () => {
  let service: TransactionJobsSafaricomService;
  let safaricomService: SafaricomService;
  let safaricomTransferScopedRepository: SafaricomTransferScopedRepository;
  let transactionScopedRepository: TransactionScopedRepository;
  let transactionJobsHelperService: TransactionJobsHelperService;

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

    transactionScopedRepository = unitRef.get<TransactionScopedRepository>(
      TransactionScopedRepository,
    );
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
    jest
      .spyOn(safaricomTransferScopedRepository, 'findOne')
      .mockResolvedValue(undefined);
    jest
      .spyOn(safaricomTransferScopedRepository, 'save')
      .mockImplementation(async (entity) => ({ ...entity, id: 1 }));
    jest
      .spyOn(transactionScopedRepository, 'update')
      .mockResolvedValue({} as UpdateResult);
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
      .spyOn(transactionScopedRepository, 'update')
      .mockResolvedValueOnce({} as UpdateResult);

    // Call the service method
    await service.processSafaricomTransactionJob(mockedSafaricomTransactionJob);

    expect(
      transactionJobsHelperService.getRegistrationOrThrow,
    ).toHaveBeenCalledWith(mockedSafaricomTransactionJob.referenceId);
    expect(safaricomService.doTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        transferAmount: mockedSafaricomTransactionJob.transactionAmount,
        phoneNumber: mockedSafaricomTransactionJob.phoneNumber,
        idNumber: mockedSafaricomTransactionJob.idNumber,
        originatorConversationId:
          mockedSafaricomTransactionJob.originatorConversationId,
      }),
    );
  });
});
