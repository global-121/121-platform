import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { SafaricomTransferScopedRepository } from '@121-service/src/fsp-integrations/integrations/safaricom/repositories/safaricom-transfer.scoped.repository';
import { SafaricomService } from '@121-service/src/fsp-integrations/integrations/safaricom/safaricom.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionJobsSafaricomService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-safaricom.service';
import { SafaricomTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/safaricom-transaction-job.dto';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

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
      .spyOn(transactionJobsHelperService, 'logTransactionJobStart')
      .mockImplementation();
    jest.spyOn(transactionsService, 'saveProgress').mockImplementation();
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

  it('should use existing safaricomTransfer and not create a new one when existing transaction is found', async () => {
    const transactionJob: SafaricomTransactionJobDto = {
      referenceId: 'ref-1',
      transactionId: 1,
      programId: 1,
      userId: 1,
      bulkSize: 10,
      transferValue: 100,
      programFspConfigurationId: 1,
      isRetry: false,
      phoneNumber: '123',
      idNumber: 'nat-123',
    };
    const existingSafaricomTransfer = { transactionId: 99 };
    (transactionsService.saveProgress as jest.Mock).mockImplementation();
    (
      transactionEventsScopedRepository.countFailedTransactionAttempts as jest.Mock
    ).mockResolvedValue(0);
    (safaricomTransferScopedRepository.findOne as jest.Mock).mockResolvedValue(
      existingSafaricomTransfer,
    );
    (safaricomService.doTransfer as jest.Mock).mockResolvedValue(undefined);
    (transactionsService.saveProgress as jest.Mock).mockImplementation();

    await service.processSafaricomTransactionJob(transactionJob);

    expect(transactionsService.saveProgress).toHaveBeenCalled();
    expect(safaricomTransferScopedRepository.save).not.toHaveBeenCalled();
    expect(safaricomTransferScopedRepository.update).toHaveBeenCalled();
    expect(safaricomService.doTransfer).toHaveBeenCalledWith({
      transferValue: 100,
      phoneNumber: '123',
      idNumber: 'nat-123',
      originatorConversationId: expect.any(String),
    });
  });
});
