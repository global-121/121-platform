import { TestBed } from '@automock/jest';
import { UpdateResult } from 'typeorm';

import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankCreateOrderReturn } from '@121-service/src/payments/fsp-integration/nedbank/interfaces/nedbank-create-order-return';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
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

    jest
      .spyOn(registrationScopedRepository, 'getByReferenceId')
      .mockResolvedValueOnce(mockedRegistration);

    jest
      .spyOn(registrationScopedRepository, 'updateUnscoped')
      .mockResolvedValueOnce({} as UpdateResult);

    jest
      .spyOn(programRepository, 'findByIdOrFail')
      .mockResolvedValueOnce(mockedProgram as ProgramEntity);

    jest
      .spyOn(transactionScopedRepository, 'save')
      .mockResolvedValueOnce({ id: mockedTransactionId } as any);

    jest
      .spyOn(
        transactionScopedRepository,
        'getFailedTransactionAttemptsForPaymentAndRegistration',
      )
      .mockResolvedValueOnce(0);
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
      phoneNumber: registrationNedbank.nationalId,
      programFinancialServiceProviderConfigurationId: 1,
    };

    const mockedCreateOrderReturn: NedbankCreateOrderReturn = {
      orderCreateReference: 'orderCreateReference',
      nedbankVoucherStatus: NedbankVoucherStatus.PENDING,
    };

    it('should process Nedbank transaction job successfully', async () => {
      jest
        .spyOn(registrationScopedRepository, 'getByReferenceId')
        .mockResolvedValueOnce(mockedRegistration);

      jest
        .spyOn(nedbankService, 'createOrder')
        .mockResolvedValueOnce(mockedCreateOrderReturn);

      jest
        .spyOn(nedbankService, 'storeVoucher')
        .mockResolvedValueOnce(undefined);

      await transactionJobProcessorsService.processNedbankTransactionJob(
        mockedNedbankTransactionJob,
      );

      expect(
        registrationScopedRepository.getByReferenceId,
      ).toHaveBeenCalledWith({
        referenceId: mockedNedbankTransactionJob.referenceId,
      });
      expect(
        transactionScopedRepository.getFailedTransactionAttemptsForPaymentAndRegistration,
      ).toHaveBeenCalledWith({
        registrationId: mockedRegistration.id,
        payment: mockedNedbankTransactionJob.paymentNumber,
      });
      expect(nedbankService.createOrder).toHaveBeenCalledWith({
        transferAmount: mockedNedbankTransactionJob.transactionAmount,
        fullName: mockedNedbankTransactionJob.fullName,
        idNumber: mockedNedbankTransactionJob.phoneNumber,
        transactionReference: `ReferenceId=${mockedNedbankTransactionJob.referenceId},PaymentNumber=${mockedSafaricomTransactionJob.paymentNumber},Attempt=0`,
      });

      expect(nedbankService.storeVoucher).toHaveBeenCalledWith({
        transactionId: mockedTransactionId,
        orderCreateReference: mockedCreateOrderReturn.orderCreateReference,
        voucherStatus: mockedCreateOrderReturn.nedbankVoucherStatus,
      });
    });

    it('should handle NedbankError when creating order', async () => {
      jest
        .spyOn(registrationScopedRepository, 'getByReferenceId')
        .mockResolvedValueOnce(mockedRegistration);

      const nedbankError = new NedbankError('Nedbank error occurred');
      jest
        .spyOn(nedbankService, 'createOrder')
        .mockRejectedValueOnce(nedbankError);

      await transactionJobProcessorsService.processNedbankTransactionJob(
        mockedNedbankTransactionJob,
      );

      expect(transactionScopedRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          payment: mockedNedbankTransactionJob.paymentNumber,
          status: TransactionStatusEnum.error,
          errorMessage: nedbankError.message,
        }),
      );
      // Store voucher is not called
      expect(nedbankService.storeVoucher).not.toHaveBeenCalled();
    });
  });
});
