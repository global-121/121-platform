import { Test, TestingModule } from '@nestjs/testing';

import { CooperativeBankOfOromiaService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { TransactionJobsCooperativeBankOfOromiaService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-cooperative-bank-of-oromia.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

describe('TransactionJobsCooperativeBankOfOromiaService', () => {
  let service: TransactionJobsCooperativeBankOfOromiaService;
  let helper: TransactionJobsHelperService;
  let cooperativeBankOfOromiaService: CooperativeBankOfOromiaService;
  let transactionEventsScopedRepository: TransactionEventsScopedRepository;
  let programConfigurationRepository: ProgramFspConfigurationRepository;
  let transactionsService: TransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionJobsCooperativeBankOfOromiaService,
        { provide: CooperativeBankOfOromiaService, useValue: {} },
        { provide: TransactionJobsHelperService, useValue: {} },
        { provide: TransactionEventsScopedRepository, useValue: {} },
        { provide: ProgramFspConfigurationRepository, useValue: {} },
        { provide: TransactionsService, useValue: {} },
      ],
    }).compile();
    service = module.get(TransactionJobsCooperativeBankOfOromiaService);
    helper = module.get(TransactionJobsHelperService);
    cooperativeBankOfOromiaService = module.get(CooperativeBankOfOromiaService);
    transactionEventsScopedRepository = module.get(
      TransactionEventsScopedRepository,
    );
    programConfigurationRepository = module.get(
      ProgramFspConfigurationRepository,
    );
    transactionsService = module.get(TransactionsService);

    programConfigurationRepository.getPropertyValueByName = jest
      .fn()
      .mockResolvedValue('debit-acc');

    helper.logTransactionJobStart = jest.fn().mockResolvedValue(undefined);
    transactionsService.saveProgress = jest.fn().mockResolvedValue(undefined);
  });

  it('should generate different messageIds for different transactions', async () => {
    const params = {
      referenceId: 'ref-1',
      transactionId: 123,
    };
    const job1 = {
      ...params,
      programFspConfigurationId: 1,
      transactionId: 123,
      userId: 1,
      isRetry: false,
      bankAccountNumber: 'acc1',
      transferValue: 100,
      programId: 1,
      bulkSize: 1,
    };
    const job2 = { ...job1, transactionId: 456 };

    // Mock countFailedTransactionAttempts to return different values;
    transactionEventsScopedRepository.countFailedTransactionAttempts = jest
      .fn()
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    // Mock initiateTransfer
    cooperativeBankOfOromiaService.initiateTransfer = jest
      .fn()
      .mockResolvedValue(undefined);

    // First call
    await service.processCooperativeBankOfOromiaTransactionJob(job1);
    // Second call
    await service.processCooperativeBankOfOromiaTransactionJob(job2);

    // Extract the messageIds used in each call
    const mockFn = cooperativeBankOfOromiaService.initiateTransfer as jest.Mock;
    const firstCallMessageId =
      mockFn.mock.calls[0][0].cooperativeBankOfOromiaMessageId;
    const secondCallMessageId =
      mockFn.mock.calls[1][0].cooperativeBankOfOromiaMessageId;

    // verify they are both 12 aplhanumeric characters
    expect(firstCallMessageId).toMatch(/^[a-zA-Z0-9]{12}$/);
    expect(secondCallMessageId).toMatch(/^[a-zA-Z0-9]{12}$/);
    // verify they are different
    expect(firstCallMessageId).not.toEqual(secondCallMessageId);
  });
});
