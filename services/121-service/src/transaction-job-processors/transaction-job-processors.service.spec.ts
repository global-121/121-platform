import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { FinancialServiceProviderEntity } from '@121-service/src/financial-service-providers/financial-service-provider.entity';
import { FinancialServiceProviderRepository } from '@121-service/src/financial-service-providers/repositories/financial-service-provider.repository';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-api.error';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { ScopedRepository } from '@121-service/src/scoped.repository';
import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

const mockedRegistration: RegistrationEntity = {
  id: 1,
  referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
  registrationStatus: 'active',
  paymentCount: 0,
  preferredLanguage: 'en',
} as unknown as RegistrationEntity;

const mockedFinancialServiceProvider: FinancialServiceProviderEntity = {
  id: 1,
  name: FinancialServiceProviderName.safaricom,
} as unknown as FinancialServiceProviderEntity;

const mockedTransaction: TransactionEntity = {
  id: 1,
  amount: 25,
  status: TransactionStatusEnum.waiting,
  userId: 1,
} as TransactionEntity;

const mockedTransactionJob: SafaricomTransactionJobDto = {
  programId: 3,
  paymentNumber: 3,
  referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
  transactionAmount: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 10,
  phoneNumber: '254708374149',
  idNumber: 'nat-123',
  originatorConversationId: 'originator-conversation-id',
};

const mockedProgram = {
  titlePortal: { en: 'Example Title' },
  published: false,
  distributionDuration: 100,
  fixedTransferValue: 500,
  budget: 50000,
  enableMaxPayments: true,
};

describe('TransactionJobProcessorsService', () => {
  let safaricomService: SafaricomService;
  let transactionJobProcessorsService: TransactionJobProcessorsService;

  let programRepository: ProgramRepository;
  let registrationScopedRepository: RegistrationScopedRepository;
  let latestTransactionRepository: LatestTransactionRepository;
  let transactionScopedRepository: ScopedRepository<TransactionEntity>;
  let financialServiceProviderRepository: FinancialServiceProviderRepository;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobProcessorsService,
    ).compile();

    transactionJobProcessorsService = unit;

    safaricomService = unitRef.get<SafaricomService>(SafaricomService);

    programRepository = unitRef.get<ProgramRepository>(ProgramRepository);
    registrationScopedRepository = unitRef.get<RegistrationScopedRepository>(
      RegistrationScopedRepository,
    );

    financialServiceProviderRepository =
      unitRef.get<FinancialServiceProviderRepository>(
        FinancialServiceProviderRepository,
      );

    transactionScopedRepository = unitRef.get<
      ScopedRepository<TransactionEntity>
    >(getScopedRepositoryProviderName(TransactionEntity));

    latestTransactionRepository = unitRef.get<LatestTransactionRepository>(
      LatestTransactionRepository,
    );
  });

  it('should be defined', () => {
    expect(transactionJobProcessorsService).toBeDefined();
  });

  it('[Idempotency] safaricom transaction job processing should fail when using same originatorConversationId', async () => {
    jest
      .spyOn(registrationScopedRepository, 'getByReferenceId')
      .mockResolvedValueOnce(mockedRegistration);

    jest
      .spyOn(registrationScopedRepository, 'updateUnscoped')
      .mockResolvedValueOnce({} as UpdateResult);

    jest
      .spyOn(financialServiceProviderRepository, 'getByName')
      .mockResolvedValueOnce(mockedFinancialServiceProvider);

    jest
      .spyOn(programRepository, 'findByIdOrFail')
      .mockResolvedValueOnce(mockedProgram as ProgramEntity);

    jest
      .spyOn(transactionScopedRepository, 'save')
      .mockResolvedValueOnce([mockedTransaction]);

    jest
      .spyOn(latestTransactionRepository, 'insertOrUpdateFromTransaction')
      .mockResolvedValueOnce();

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
    await transactionJobProcessorsService.processSafaricomTransactionJob(
      mockedTransactionJob,
    );

    expect(registrationScopedRepository.getByReferenceId).toHaveBeenCalledWith({
      referenceId: mockedTransactionJob.referenceId,
    });
    expect(financialServiceProviderRepository.getByName).toHaveBeenCalledWith(
      FinancialServiceProviderName.safaricom,
    );
    expect(safaricomService.doTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        transferAmount: mockedTransactionJob.transactionAmount,
        phoneNumber: mockedTransactionJob.phoneNumber,
        idNumber: mockedTransactionJob.idNumber,
        originatorConversationId: mockedTransactionJob.originatorConversationId,
      }),
    );
  });
});
