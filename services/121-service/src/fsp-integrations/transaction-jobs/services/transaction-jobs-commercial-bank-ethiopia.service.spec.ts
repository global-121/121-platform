import { TestBed } from '@automock/jest';

import { CbeTransferScopedRepository } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/commercial-bank-ethiopia.scoped.repository';
import { CommercialBankEthiopiaService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { TransactionJobsCommercialBankEthiopiaService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-commercial-bank-ethiopia.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { CommercialBankEthiopiaTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/commercial-bank-ethiopia-transaction-job.dto';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';

describe('TransactionJobsCommercialBankEthiopiaService', () => {
  let service: TransactionJobsCommercialBankEthiopiaService;
  let commercialBankEthiopiaService: CommercialBankEthiopiaService;
  let programFspConfigurationRepository: ProgramFspConfigurationRepository;
  let cbeTransferScopedRepository: CbeTransferScopedRepository;
  let transactionJobsHelperService: TransactionJobsHelperService;
  let programRepository: ProgramRepository;

  // Shared variables
  let credentials: { username: string; password: string };
  let program: { ngo: string; titlePortal: string; currency: string };
  let transactionJob: CommercialBankEthiopiaTransactionJobDto;
  let transactionJobRetry: CommercialBankEthiopiaTransactionJobDto;
  let existingCbeTransfer: { debitTheirRef: string };
  let mockTransaction: TransactionEntity;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsCommercialBankEthiopiaService,
    ).compile();
    service = unit;
    commercialBankEthiopiaService = unitRef.get(CommercialBankEthiopiaService);
    programFspConfigurationRepository = unitRef.get(
      ProgramFspConfigurationRepository,
    );
    cbeTransferScopedRepository = unitRef.get(CbeTransferScopedRepository);
    transactionJobsHelperService = unitRef.get(TransactionJobsHelperService);
    programRepository = unitRef.get(ProgramRepository);

    credentials = { username: 'user', password: 'pass' };
    program = { ngo: 'NGO', titlePortal: 'Title', currency: 'ETB' };
    transactionJob = {
      programId: 1,
      transactionId: 2,
      referenceId: 'ref-1',
      programFspConfigurationId: 3,
      transferValue: 100,
      isRetry: false,
      userId: 4,
      bulkSize: 1,
      bankAccountNumber: 'acc-1',
      fullName: 'John Doe',
      debitTheirRef: 'debit-ref-from-transaction-job',
    };
    transactionJobRetry = {
      programId: 1,
      transactionId: 2,
      referenceId: 'ref-1',
      programFspConfigurationId: 3,
      transferValue: 100,
      isRetry: true,
      userId: 4,
      bulkSize: 1,
      bankAccountNumber: 'acc-1',
      fullName: 'John Doe',
    };
    existingCbeTransfer = {
      debitTheirRef: 'retry-ref-from-previous-transaction',
    };
    mockTransaction = new TransactionEntity();
    mockTransaction.id = 1;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call createCreditTransferOrGetTransactionStatus with correct params (not retry)', async () => {
    jest
      .spyOn(programFspConfigurationRepository, 'getUsernamePasswordProperties')
      .mockResolvedValue(credentials);
    jest
      .spyOn(transactionJobsHelperService, 'logTransactionJobStart')
      .mockImplementation();
    jest
      .spyOn(programRepository, 'findOneOrFail')
      .mockResolvedValue(program as any);
    const createCreditTransferSpy = jest
      .spyOn(
        commercialBankEthiopiaService,
        'createCreditTransferOrGetTransactionStatus',
      )
      .mockResolvedValue({
        status: 'success',
        errorMessage: null,
      });

    await service.processCommercialBankEthiopiaTransactionJob(transactionJob);

    expect(createCreditTransferSpy).toHaveBeenCalledWith({
      inputParams: {
        debitTheirRef: 'debit-ref-from-transaction-job',
        bankAccountNumber: 'acc-1',
        ngoName: 'NGO',
        titlePortal: 'Title',
        currency: 'ETB',
        fullName: 'John Doe',
        amount: 100,
      },
      credentials,
    });
  });

  it('should use debitTheirRef from previous transaction if isRetry', async () => {
    jest
      .spyOn(programFspConfigurationRepository, 'getUsernamePasswordProperties')
      .mockResolvedValue(credentials);
    jest
      .spyOn(transactionJobsHelperService, 'logTransactionJobStart')
      .mockImplementation();
    jest
      .spyOn(programRepository, 'findOneOrFail')
      .mockResolvedValue(program as any);
    jest
      .spyOn(cbeTransferScopedRepository, 'getExistingCbeTransferOrFail')
      .mockResolvedValue(existingCbeTransfer as any);
    const createCreditTransferSpy = jest
      .spyOn(
        commercialBankEthiopiaService,
        'createCreditTransferOrGetTransactionStatus',
      )
      .mockResolvedValue({
        status: 'success',
        errorMessage: null,
      });

    await service.processCommercialBankEthiopiaTransactionJob(
      transactionJobRetry,
    );

    expect(createCreditTransferSpy).toHaveBeenCalledWith({
      inputParams: {
        debitTheirRef: 'retry-ref-from-previous-transaction',
        bankAccountNumber: 'acc-1',
        ngoName: 'NGO',
        titlePortal: 'Title',
        currency: 'ETB',
        fullName: 'John Doe',
        amount: 100,
      },
      credentials,
    });
  });

  it('should save CBE transfer exactly once when not retry', async () => {
    jest
      .spyOn(programFspConfigurationRepository, 'getUsernamePasswordProperties')
      .mockResolvedValue(credentials);
    jest
      .spyOn(transactionJobsHelperService, 'logTransactionJobStart')
      .mockImplementation();
    jest
      .spyOn(programRepository, 'findOneOrFail')
      .mockResolvedValue(program as any);
    jest
      .spyOn(
        commercialBankEthiopiaService,
        'createCreditTransferOrGetTransactionStatus',
      )
      .mockResolvedValue({
        status: 'success',
        errorMessage: null,
      });

    const saveCbeTransferSpy = jest
      .spyOn(cbeTransferScopedRepository, 'save')
      .mockResolvedValue({} as any);

    await service.processCommercialBankEthiopiaTransactionJob(transactionJob);
    expect(saveCbeTransferSpy).toHaveBeenCalledTimes(1);
  });

  it('should not save CBE transfer when retry', async () => {
    jest
      .spyOn(programFspConfigurationRepository, 'getUsernamePasswordProperties')
      .mockResolvedValue(credentials);
    jest
      .spyOn(transactionJobsHelperService, 'logTransactionJobStart')
      .mockImplementation();
    jest
      .spyOn(programRepository, 'findOneOrFail')
      .mockResolvedValue(program as any);
    jest
      .spyOn(
        commercialBankEthiopiaService,
        'createCreditTransferOrGetTransactionStatus',
      )
      .mockResolvedValue({
        status: 'success',
        errorMessage: null,
      });
    jest
      .spyOn(cbeTransferScopedRepository, 'getExistingCbeTransferOrFail')
      .mockResolvedValue(existingCbeTransfer as any);

    const saveCbeTransferSpy = jest
      .spyOn(cbeTransferScopedRepository, 'save')
      .mockResolvedValue({} as any);

    await service.processCommercialBankEthiopiaTransactionJob(
      transactionJobRetry,
    );
    expect(saveCbeTransferSpy).not.toHaveBeenCalled();
  });
});
