import { TestBed } from '@automock/jest';
import { Equal, UpdateResult } from 'typeorm';

import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/airtel.service';
import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel.error';
import { AirtelApiError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel-api.error';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank.service';
import { NedbankVoucherScopedRepository } from '@121-service/src/payments/fsp-integration/nedbank/repositories/nedbank-voucher.scoped.repository';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/errors/safaricom-api.error';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { LatestTransactionRepository } from '@121-service/src/payments/transactions/repositories/latest-transaction.repository';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.repository';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { TransactionJobProcessorsService } from '@121-service/src/transaction-job-processors/transaction-job-processors.service';
import { AirtelTransactionJobDto } from '@121-service/src/transaction-queues/dto/airtel-transaction-job.dto';
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
  programFspConfigurationId: 1,
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
  let airtelService: AirtelService;
  let transactionJobProcessorsService: TransactionJobProcessorsService;

  let programRepository: ProgramRepository;
  let registrationScopedRepository: RegistrationScopedRepository;
  let latestTransactionRepository: LatestTransactionRepository;
  let transactionScopedRepository: TransactionScopedRepository;
  let nedbankVoucherScopedRepository: NedbankVoucherScopedRepository;
  let programFspConfigurationRepository: ProgramFspConfigurationRepository;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      TransactionJobProcessorsService,
    ).compile();

    transactionJobProcessorsService = unit;

    safaricomService = unitRef.get<SafaricomService>(SafaricomService);
    nedbankService = unitRef.get<NedbankService>(NedbankService);
    airtelService = unitRef.get<AirtelService>(AirtelService);

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
    programFspConfigurationRepository =
      unitRef.get<ProgramFspConfigurationRepository>(
        ProgramFspConfigurationRepository,
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

  describe('Airtel transaction job processing', () => {
    const mockedAirtelTransactionJob: AirtelTransactionJobDto = {
      programId: 7,
      programFspConfigurationId: 1,
      paymentNumber: 7,
      referenceId: 'a3d1f489-2718-4430-863f-5abc14523691',
      transactionAmount: 27,
      isRetry: false,
      userId: 1,
      bulkSize: 10,
      phoneNumber: '123456789',
    };

    it('should get the registration from the registration repository using the referenceId', async () => {
      // Arrange
      jest
        .spyOn(airtelService, 'attemptOrCheckDisbursement')
        .mockResolvedValueOnce(undefined);

      // Act
      await transactionJobProcessorsService.processAirtelTransactionJob(
        mockedAirtelTransactionJob,
      );

      // Assert
      expect(
        registrationScopedRepository.getByReferenceId,
      ).toHaveBeenCalledWith({
        referenceId: mockedAirtelTransactionJob.referenceId,
      });
    });

    it('should get number of failed transactions', async () => {
      // Arrange
      jest
        .spyOn(airtelService, 'attemptOrCheckDisbursement')
        .mockResolvedValueOnce(undefined);

      // Act
      await transactionJobProcessorsService.processAirtelTransactionJob(
        mockedAirtelTransactionJob,
      );

      // Assert
      expect(transactionScopedRepository.count).toHaveBeenCalledWith({
        where: {
          registrationId: Equal(mockedRegistration.id),
          payment: Equal(mockedAirtelTransactionJob.paymentNumber),
          status: Equal(TransactionStatusEnum.error),
        },
      });
    });

    it('should correctly call attemptOrCheckDisbursement', async () => {
      // Arrange
      jest
        .spyOn(airtelService, 'attemptOrCheckDisbursement')
        .mockResolvedValueOnce(undefined);

      // Act
      await transactionJobProcessorsService.processAirtelTransactionJob(
        mockedAirtelTransactionJob,
      );

      // Assert
      expect(airtelService.attemptOrCheckDisbursement).toHaveBeenCalledWith({
        // This is the (deterministic) Airtel transaction ID that is generated
        // for the static test data.
        airtelTransactionId:
          '972b054e8284535d571844a11cd2065f05c93acfbf53405e4fcaa4e10cdd73b9',
        phoneNumber: mockedAirtelTransactionJob.phoneNumber,
        amount: mockedAirtelTransactionJob.transactionAmount,
      });
    });

    describe('should create a transaction with status', () => {
      it('success when an Airtel disburse succeeds', async () => {
        // Arrange
        jest
          .spyOn(airtelService, 'attemptOrCheckDisbursement')
          .mockResolvedValueOnce(undefined);

        // TODO: possibly refactor after rebase
        // Act
        await transactionJobProcessorsService.processAirtelTransactionJob(
          mockedAirtelTransactionJob,
        );

        // Assert
        expect(transactionScopedRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            payment: mockedAirtelTransactionJob.paymentNumber,
            status: TransactionStatusEnum.success,
          }),
        );
      });

      it('error when an Airtel disburse fails', async () => {
        // TODO: possibly refactor after rebase
        // Arrange
        const airtelError = new AirtelError(
          'error occurred - mock',
          AirtelDisbursementResultEnum.fail,
        );
        jest
          .spyOn(airtelService, 'attemptOrCheckDisbursement')
          .mockRejectedValueOnce(airtelError);

        // Act
        await transactionJobProcessorsService.processAirtelTransactionJob(
          mockedAirtelTransactionJob,
        );

        // Assert
        expect(transactionScopedRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            payment: mockedAirtelTransactionJob.paymentNumber,
            status: TransactionStatusEnum.error,
            errorMessage: 'Airtel Error: error occurred - mock',
          }),
        );
      });

      it('waiting when an Airtel disburse is ambiguous', async () => {
        // TODO: possibly refactor after rebase
        // Arrange
        const airtelError = new AirtelError(
          'ambiguous response given',
          AirtelDisbursementResultEnum.ambiguous,
        );
        // Overrides the spyOn in beforeEach
        jest
          .spyOn(airtelService, 'attemptOrCheckDisbursement')
          .mockRejectedValueOnce(airtelError);

        // Act
        await transactionJobProcessorsService.processAirtelTransactionJob(
          mockedAirtelTransactionJob,
        );

        // Assert
        expect(transactionScopedRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            payment: mockedAirtelTransactionJob.paymentNumber,
            status: TransactionStatusEnum.waiting,
            errorMessage: 'Airtel Error: ambiguous response given',
          }),
        );
      });

      it('error when an Airtel API Error occurs', async () => {
        // TODO: possibly refactor after rebase
        // Arrange
        const airtelApiError = new AirtelApiError('network request failed');
        jest
          .spyOn(airtelService, 'attemptOrCheckDisbursement')
          .mockRejectedValueOnce(airtelApiError);

        // Act
        await transactionJobProcessorsService.processAirtelTransactionJob(
          mockedAirtelTransactionJob,
        );

        // Assert
        expect(transactionScopedRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            payment: mockedAirtelTransactionJob.paymentNumber,
            status: TransactionStatusEnum.error,
            errorMessage: 'Airtel API Error: network request failed',
          }),
        );
      });
    });
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
      programFspConfigurationId: 1,
    };

    const mockedCreateOrderReturn = NedbankVoucherStatus.PENDING;

    it('should process Nedbank transaction job successfully', async () => {
      jest
        .spyOn(programFspConfigurationRepository, 'getPropertyValueByName')
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
        .spyOn(programFspConfigurationRepository, 'getPropertyValueByName')
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
        .spyOn(programFspConfigurationRepository, 'getPropertyValueByName')
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
        .spyOn(programFspConfigurationRepository, 'getPropertyValueByName')
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
