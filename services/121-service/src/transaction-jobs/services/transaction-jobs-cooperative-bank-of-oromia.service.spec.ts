import { CooperativeBankOfOromiaDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaError } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/errors/cooperative-bank-of-oromia.error';
import { CooperativeBankOfOromiaService } from '@121-service/src/payments/fsp-integration/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventCreationContext } from '@121-service/src/payments/transactions/transaction-events/interfaces/transaction-event-creation-context.interfac';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { TransactionJobsCooperativeBankOfOromiaService } from '@121-service/src/transaction-jobs/services/transaction-jobs-cooperative-bank-of-oromia.service';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { CooperativeBankOfOromiaTransactionJobDto } from '@121-service/src/transaction-queues/dto/cooperative-bank-of-oromia-transaction-job.dto';

describe('TransactionJobsCooperativeBankOfOromiaService', () => {
  let service: TransactionJobsCooperativeBankOfOromiaService;
  let airtelService: jest.Mocked<CooperativeBankOfOromiaService>;
  let transactionEventScopedRepository: jest.Mocked<TransactionEventsScopedRepository>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;
  let transactionsService: jest.Mocked<TransactionsService>;

  const transactionJob: CooperativeBankOfOromiaTransactionJobDto = {
    programId: 3,
    programFspConfigurationId: 3,
    transactionId: 3,
    referenceId: 'ref-3',
    transferValue: 300,
    isRetry: false,
    userId: 3,
    bulkSize: 30,
    phoneNumber: '123',
  };

  const transactionEventContext: TransactionEventCreationContext = {
    transactionId: transactionJob.transactionId,
    userId: transactionJob.userId,
    programFspConfigurationId: transactionJob.programFspConfigurationId,
  };

  beforeEach(async () => {
    airtelService = { attemptOrCheckDisbursement: jest.fn() } as any;
    transactionJobsHelperService = {
      createInitiatedOrRetryTransactionEvent: jest.fn(),
    } as any;
    transactionEventScopedRepository = {
      countFailedTransactionAttempts: jest.fn().mockResolvedValue(6),
    } as any;
    transactionsService = {
      saveTransactionProgress: jest.fn(),
    } as any;

    service = new TransactionJobsCooperativeBankOfOromiaService(
      airtelService,
      transactionJobsHelperService,
      transactionEventScopedRepository,
      transactionsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processCooperativeBankOfOromiaTransactionJob - happy path', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call createInitiatedOrRetryTransactionEvent with the right arguments', async () => {
      // Act
      await service.processCooperativeBankOfOromiaTransactionJob(transactionJob);

      // Assert
      expect(
        transactionJobsHelperService.createInitiatedOrRetryTransactionEvent,
      ).toHaveBeenCalledWith({
        context: transactionEventContext,
        isRetry: transactionJob.isRetry,
      });
    });

    it('should call attemptOrCheckDisbursement with the right arguments', async () => {
      // Act
      await service.processCooperativeBankOfOromiaTransactionJob(transactionJob);

      // Assert
      // Deterministic based on input.
      const deterministicAirtelTransactionId =
        'd52e95c6213f718dd2825268239c12eaf80527a629ded5543bdbb07e73a2deff';
      expect(airtelService.attemptOrCheckDisbursement).toHaveBeenCalledWith({
        cooperativeBankOfOromiaTransactionId: deterministicAirtelTransactionId,
        phoneNumber: transactionJob.phoneNumber,
        amount: transactionJob.transferValue,
      });
    });

    it('should call attemptOrCheckDisbursement with a different cooperativeBankOfOromiaTransactionId if the failedTransactionsCount is different', async () => {
      // Arrange
      (
        transactionEventScopedRepository.countFailedTransactionAttempts as jest.Mock
      ).mockResolvedValue(4);

      // Act
      await service.processCooperativeBankOfOromiaTransactionJob(transactionJob);

      // Assert
      // Different from the previous test.
      const deterministicAirtelTransactionId =
        '6431440a8d588083454dfcc2c3ff4bd7005eebb2f0f3c446d1d162e7353c22f0';
      expect(airtelService.attemptOrCheckDisbursement).toHaveBeenCalledWith({
        cooperativeBankOfOromiaTransactionId: deterministicAirtelTransactionId,
        phoneNumber: transactionJob.phoneNumber,
        amount: transactionJob.transferValue,
      });
    });

    it('should call saveTransactionProcessingProgress with the right arguments', async () => {
      // Act
      await service.processCooperativeBankOfOromiaTransactionJob(transactionJob);

      // Assert
      expect(transactionsService.saveTransactionProgress).toHaveBeenCalledWith({
        context: transactionEventContext,
        description: TransactionEventDescription.airtelRequestSent,
        newTransactionStatus: TransactionStatusEnum.success,
        errorMessage: undefined,
      });
    });
  });

  describe('processCooperativeBankOfOromiaTransactionJob - unhappy path', () => {
    it("should call saveTransactionProcessingProgress with certain arguments when attemptOrCheckDisbursement throws an CooperativeBankOfOromiaError that\'s CooperativeBankOfOromiaDisbursementResultEnum.ambiguous", async () => {
      // Arrange
      (airtelService.attemptOrCheckDisbursement as jest.Mock).mockRejectedValue(
        new CooperativeBankOfOromiaError(
          'mock-ambiguous-message',
          CooperativeBankOfOromiaDisbursementResultEnum.ambiguous,
        ),
      );

      // Act
      await service.processCooperativeBankOfOromiaTransactionJob(transactionJob);

      expect(transactionsService.saveTransactionProgress).toHaveBeenCalledWith({
        context: transactionEventContext,
        description: TransactionEventDescription.airtelRequestSent,
        newTransactionStatus: TransactionStatusEnum.waiting,
        errorMessage: 'CooperativeBankOfOromia Error: mock-ambiguous-message',
      });
    });

    it("should call saveTransactionProcessingProgress with certain arguments when attemptOrCheckDisbursement throws an CooperativeBankOfOromia error that's not ambiguous", async () => {
      // Arrange
      (airtelService.attemptOrCheckDisbursement as jest.Mock).mockRejectedValue(
        new CooperativeBankOfOromiaError('mock-fail-message', CooperativeBankOfOromiaDisbursementResultEnum.fail),
      );

      // Act
      await service.processCooperativeBankOfOromiaTransactionJob(transactionJob);

      expect(transactionsService.saveTransactionProgress).toHaveBeenCalledWith({
        context: transactionEventContext,
        description: TransactionEventDescription.airtelRequestSent,
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'CooperativeBankOfOromia Error: mock-fail-message',
      });
    });

    it('should throw when attemptOrCheckDisbursement throws a non-CooperativeBankOfOromia error', async () => {
      // Arrange
      const mockErrorMessage = 'mock-misc-error-message';
      (airtelService.attemptOrCheckDisbursement as jest.Mock).mockRejectedValue(
        new Error(mockErrorMessage),
      );

      // Act

      let error: Error | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.processCooperativeBankOfOromiaTransactionJob(transactionJob);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).not.toBeInstanceOf(CooperativeBankOfOromiaError);
      expect(error.message).toBe(mockErrorMessage);
    });
  });
});
