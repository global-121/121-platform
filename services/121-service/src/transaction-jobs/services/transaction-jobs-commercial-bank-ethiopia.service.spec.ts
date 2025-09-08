import { TestBed } from '@automock/jest';

import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { TransactionJobsCommercialBankEthiopiaService } from '@121-service/src/transaction-jobs/services/transaction-jobs-commercial-bank-ethiopia.service';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { CommercialBankEthiopiaTransactionJobDto } from '@121-service/src/transaction-queues/dto/commercial-bank-ethiopia-transaction-job.dto';

describe('TransactionJobsCommercialBankEthiopiaService', () => {
  let service: TransactionJobsCommercialBankEthiopiaService;
  let commercialBankEthiopiaService: CommercialBankEthiopiaService;
  let programFspConfigurationRepository: ProgramFspConfigurationRepository;
  let transactionScopedRepository: TransactionScopedRepository;
  let transactionJobsHelperService: TransactionJobsHelperService;
  let programRepository: ProgramRepository;

  // Shared variables
  let credentials: { username: string; password: string };
  let program: { ngo: string; titlePortal: string; currency: string };
  let registration: RegistrationEntity;
  let transactionJob: CommercialBankEthiopiaTransactionJobDto;
  let transactionJobRetry: CommercialBankEthiopiaTransactionJobDto;
  let previousTransaction: {
    customData: { requestResult: { debitTheirRef: string } };
  };

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobsCommercialBankEthiopiaService,
    ).compile();
    service = unit;
    commercialBankEthiopiaService = unitRef.get(CommercialBankEthiopiaService);
    programFspConfigurationRepository = unitRef.get(
      ProgramFspConfigurationRepository,
    );
    transactionScopedRepository = unitRef.get(TransactionScopedRepository);
    transactionJobsHelperService = unitRef.get(TransactionJobsHelperService);
    programRepository = unitRef.get(ProgramRepository);

    credentials = { username: 'user', password: 'pass' };
    program = { ngo: 'NGO', titlePortal: 'Title', currency: 'ETB' };
    registration = { id: 10 } as RegistrationEntity;
    transactionJob = {
      programId: 1,
      paymentId: 2,
      referenceId: 'ref-1',
      programFspConfigurationId: 3,
      transactionAmount: 100,
      isRetry: false,
      userId: 4,
      bulkSize: 1,
      bankAccountNumber: 'acc-1',
      fullName: 'John Doe',
      debitTheirRef: 'debit-ref-from-transaction-job',
    };
    transactionJobRetry = {
      programId: 1,
      paymentId: 2,
      referenceId: 'ref-1',
      programFspConfigurationId: 3,
      transactionAmount: 100,
      isRetry: true,
      userId: 4,
      bulkSize: 1,
      bankAccountNumber: 'acc-1',
      fullName: 'John Doe',
    };
    previousTransaction = {
      customData: {
        requestResult: { debitTheirRef: 'retry-ref-from-previous-transaction' },
      },
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call createCreditTransferOrGetTransactionStatus with correct params (not retry)', async () => {
    jest
      .spyOn(programFspConfigurationRepository, 'getUsernamePasswordProperties')
      .mockResolvedValue(credentials);
    jest
      .spyOn(transactionJobsHelperService, 'getRegistrationOrThrow')
      .mockResolvedValue(registration);
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
        customData: {},
      });
    jest.spyOn(
      transactionJobsHelperService,
      'createTransactionAndUpdateRegistration',
    );

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
      .spyOn(transactionJobsHelperService, 'getRegistrationOrThrow')
      .mockResolvedValue(registration);
    jest
      .spyOn(programRepository, 'findOneOrFail')
      .mockResolvedValue(program as any);
    jest
      .spyOn(transactionScopedRepository, 'findOneOrFail')
      .mockResolvedValue(previousTransaction as any);
    const createCreditTransferSpy = jest
      .spyOn(
        commercialBankEthiopiaService,
        'createCreditTransferOrGetTransactionStatus',
      )
      .mockResolvedValue({
        status: 'success',
        errorMessage: null,
        customData: {},
      });
    jest
      .spyOn(
        transactionJobsHelperService,
        'createTransactionAndUpdateRegistration',
      )
      .mockResolvedValue(new TransactionEntity());

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
});
