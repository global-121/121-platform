import { TestBed } from '@automock/jest';
import { Equal, UpdateResult } from 'typeorm';

import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { ProgramFinancialServiceProviderConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-financial-service-provider-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { registrationNedbank } from '@121-service/test/registrations/pagination/pagination-data';

const mockedRegistration: RegistrationEntity = {
  id: 1,
  referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
  registrationStatus: 'active',
  paymentCount: 0,
  preferredLanguage: 'en',
} as unknown as RegistrationEntity;

const mockedTransactionId = 1;

const mockedSafaricomTransactionJob: SafaricomTransactionJobDto = {
  programId: 3,
  paymentNumber: 3,
  referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
  transactionAmount: 25,
  isRetry: false,
  userId: 1,
  bulkSize: 10,
  phoneNumber: '254708374149',
  idNumber: 'nat-123',
  programFinancialServiceProviderConfigurationId: 1,
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
  let nedbankService: NedbankService;
  let transactionJobProcessorsService: TransactionJobProcessorsService;

  let programRepository: ProgramRepository;
  let registrationScopedRepository: RegistrationScopedRepository;
  let latestTransactionRepository: LatestTransactionRepository;
  let transactionScopedRepository: TransactionScopedRepository;
  let nedbankVoucherScopedRepository: NedbankVoucherScopedRepository;
  let programFinancialServiceProviderConfigurationRepository: ProgramFinancialServiceProviderConfigurationRepository;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobProcessorsService,
    ).compile();

    transactionJobProcessorsService = unit;

    safaricomService = unitRef.get<SafaricomService>(SafaricomService);
    nedbankService = unitRef.get<NedbankService>(NedbankService);

    programRepository = unitRef.get<ProgramRepository>(ProgramRepository);
    registrationScopedRepository = unitRef.get<RegistrationScopedRepository>(
      RegistrationScopedRepository,
    );
    transactionScopedRepository = unitRef.get<TransactionScopedRepository>(
      TransactionScopedRepository,
    );

    latestTransactionRepository = unitRef.get<LatestTransactionRepository>(
      LatestTransactionRepository,
    );
    nedbankVoucherScopedRepository =
      unitRef.get<NedbankVoucherScopedRepository>(
        NedbankVoucherScopedRepository,
      );
    programFinancialServiceProviderConfigurationRepository =
      unitRef.get<ProgramFinancialServiceProviderConfigurationRepository>(
        ProgramFinancialServiceProviderConfigurationRepository,
      );

    jest
      .spyOn(registrationScopedRepository, 'getByReferenceId')
      .mockResolvedValue(mockedRegistration);

    jest
      .spyOn(registrationScopedRepository, 'updateUnscoped')
      .mockResolvedValue({} as UpdateResult);

    jest
      .spyOn(programRepository, 'findByIdOrFail')
      .mockResolvedValue(mockedProgram as ProgramEntity);

    jest
      .spyOn(transactionScopedRepository, 'save')
      .mockResolvedValue({ id: mockedTransactionId } as any);

    jest.spyOn(transactionScopedRepository, 'count').mockResolvedValueOnce(0);
  });

  it('should be defined', () => {
    expect(transactionJobProcessorsService).toBeDefined();
  });

  it('[Idempotency] safaricom transaction job processing should fail when using same originatorConversationId', async () => {
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
      mockedSafaricomTransactionJob,
    );

    expect(registrationScopedRepository.getByReferenceId).toHaveBeenCalledWith({
      referenceId: mockedSafaricomTransactionJob.referenceId,
    });
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

  describe('Nedbank transaction job processing', () => {
    const mockedNedbankTransactionJob: NedbankTransactionJobDto = {
      programId: 3,
      paymentNumber: 3,
      referenceId: registrationNedbank.referenceId,
      transactionAmount: 25,
      isRetry: false,
      userId: 1,
      bulkSize: 10,
      phoneNumber: registrationNedbank.phoneNumber,
      programFinancialServiceProviderConfigurationId: 1,
    };

    const mockedCreateOrderReturn = NedbankVoucherStatus.PENDING;

    it('should process Nedbank transaction job successfully', async () => {
      jest
        .spyOn(
          programFinancialServiceProviderConfigurationRepository,
          'getPropertyValueByName',
        )
        .mockResolvedValue('ref#1');

      jest
        .spyOn(nedbankService, 'createVoucher')
        .mockResolvedValueOnce(mockedCreateOrderReturn);

      jest
        .spyOn(nedbankVoucherScopedRepository, 'storeVoucher')
        .mockResolvedValueOnce(undefined);

      await transactionJobProcessorsService.processNedbankTransactionJob(
        mockedNedbankTransactionJob,
      );

      expect(
        registrationScopedRepository.getByReferenceId,
      ).toHaveBeenCalledWith({
        referenceId: mockedNedbankTransactionJob.referenceId,
      });
      expect(transactionScopedRepository.count).toHaveBeenCalledWith({
        where: {
          registrationId: Equal(mockedRegistration.id),
          payment: Equal(mockedNedbankTransactionJob.paymentNumber),
          status: Equal(TransactionStatusEnum.error),
        },
      });
      expect(nedbankService.createVoucher).toHaveBeenCalledWith({
        transferAmount: mockedNedbankTransactionJob.transactionAmount,
        phoneNumber: mockedNedbankTransactionJob.phoneNumber,
        orderCreateReference: expect.any(String),
        paymentReference: expect.any(String),
      });

      expect(nedbankVoucherScopedRepository.storeVoucher).toHaveBeenCalledWith({
        transactionId: mockedTransactionId,
        orderCreateReference: expect.any(String),
        paymentReference: expect.any(String),
      });
      expect(transactionScopedRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          payment: mockedNedbankTransactionJob.paymentNumber,
          status: TransactionStatusEnum.waiting,
        }),
      );
      expect(nedbankVoucherScopedRepository.update).toHaveBeenCalledWith(
        { orderCreateReference: expect.any(String) },
        { status: mockedCreateOrderReturn },
      );
    });

    it('should create a transaction with status error and a voucher with status failed when a Nedbank error occurs', async () => {
      jest
        .spyOn(
          programFinancialServiceProviderConfigurationRepository,
          'getPropertyValueByName',
        )
        .mockResolvedValue('ref#1');
      const errorMessage = 'Nedbank error occurred';
      const nedbankError = new NedbankError(errorMessage);
      jest
        .spyOn(nedbankService, 'createVoucher')
        .mockRejectedValueOnce(nedbankError);

      await transactionJobProcessorsService.processNedbankTransactionJob(
        mockedNedbankTransactionJob,
      );

      expect(transactionScopedRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          payment: mockedNedbankTransactionJob.paymentNumber,
          status: TransactionStatusEnum.waiting,
        }),
      );
      expect(transactionScopedRepository.update).toHaveBeenCalledWith(
        { id: expect.any(Number) },
        {
          status: TransactionStatusEnum.error,
          errorMessage: expect.stringContaining(errorMessage),
        },
      );
      expect(nedbankVoucherScopedRepository.update).toHaveBeenCalledWith(
        { orderCreateReference: expect.any(String) },
        { status: NedbankVoucherStatus.FAILED },
      );
    });

    it('should never create a payment reference longer than 30 characters', async () => {
      const longPaymentReference = '1234567890123456789012345678901234567890';
      jest
        .spyOn(
          programFinancialServiceProviderConfigurationRepository,
          'getPropertyValueByName',
        )
        .mockResolvedValue(longPaymentReference);

      await transactionJobProcessorsService.processNedbankTransactionJob(
        mockedNedbankTransactionJob,
      );
      expect(nedbankService.createVoucher).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentReference: expect.stringMatching(new RegExp(`^.{1,30}$`)), // Check if the length is not longer than 30 characters
        }),
      );

      expect(nedbankService.createVoucher).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentReference: expect.stringContaining(
            mockedNedbankTransactionJob.phoneNumber,
          ), // Check if it contains the phone number
        }),
      );
    });

    it('should never create a payment reference with special characters in it except a dash', async () => {
      const specialCharPaymentReference = '1234@5678#9012$3456%7890^';
      jest
        .spyOn(
          programFinancialServiceProviderConfigurationRepository,
          'getPropertyValueByName',
        )
        .mockResolvedValue(specialCharPaymentReference);

      await transactionJobProcessorsService.processNedbankTransactionJob(
        mockedNedbankTransactionJob,
      );
      expect(nedbankService.createVoucher).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentReference: expect.stringMatching(/^[a-zA-Z0-9-]*$/), // Check if it contains only alphanumeric characters and dashes
        }),
      );
    });
  });
});
