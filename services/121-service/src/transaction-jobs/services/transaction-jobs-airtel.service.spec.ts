import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel.error';
import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { SaveTransactionProgressAndRelatedDataContext } from '@121-service/src/transaction-jobs/interfaces/save-transaction-progress-and-related-data-context.interface';
import { TransactionJobsAirtelService } from '@121-service/src/transaction-jobs/services/transaction-jobs-airtel.service';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { AirtelTransactionJobDto } from '@121-service/src/transaction-queues/dto/airtel-transaction-job.dto';

describe('TransactionJobsAirtelService', () => {
  let service: TransactionJobsAirtelService;
  let airtelService: jest.Mocked<AirtelService>;
  let transactionEventScopedRepository: jest.Mocked<TransactionEventsScopedRepository>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;

  const transactionJob: AirtelTransactionJobDto = {
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

  const transactionEventContext: SaveTransactionProgressAndRelatedDataContext =
    {
      transactionId: transactionJob.transactionId,
      userId: transactionJob.userId,
      programFspConfigurationId: transactionJob.programFspConfigurationId,
      programId: transactionJob.programId,
      referenceId: transactionJob.referenceId,
    };

  beforeEach(async () => {
    airtelService = { attemptOrCheckDisbursement: jest.fn() } as any;
    transactionJobsHelperService = {
      createInitiatedOrRetryTransactionEvent: jest.fn(),
      saveTransactionProgressAndUpdateRelatedData: jest.fn(),
    } as any;
    transactionEventScopedRepository = {
      countFailedTransactionAttempts: jest.fn().mockResolvedValue(6),
    } as any;

    service = new TransactionJobsAirtelService(
      airtelService,
      transactionJobsHelperService,
      transactionEventScopedRepository,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processAirtelTransactionJob - happy path', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call createInitiatedOrRetryTransactionEvent with the right arguments', async () => {
      // Act
      await service.processAirtelTransactionJob(transactionJob);

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
      await service.processAirtelTransactionJob(transactionJob);

      // Assert
      // Deterministic based on input.
      const deterministicAirtelTransactionId =
        'd52e95c6213f718dd2825268239c12eaf80527a629ded5543bdbb07e73a2deff';
      expect(airtelService.attemptOrCheckDisbursement).toHaveBeenCalledWith({
        airtelTransactionId: deterministicAirtelTransactionId,
        phoneNumber: transactionJob.phoneNumber,
        amount: transactionJob.transferValue,
      });
    });

    it('should call attemptOrCheckDisbursement with a different airtelTransactionId if the failedTransactionsCount is different', async () => {
      // Arrange
      (
        transactionEventScopedRepository.countFailedTransactionAttempts as jest.Mock
      ).mockResolvedValue(4);

      // Act
      await service.processAirtelTransactionJob(transactionJob);

      // Assert
      // Different from the previous test.
      const deterministicAirtelTransactionId =
        '6431440a8d588083454dfcc2c3ff4bd7005eebb2f0f3c446d1d162e7353c22f0';
      expect(airtelService.attemptOrCheckDisbursement).toHaveBeenCalledWith({
        airtelTransactionId: deterministicAirtelTransactionId,
        phoneNumber: transactionJob.phoneNumber,
        amount: transactionJob.transferValue,
      });
    });

    it('should call saveTransactionProcessingProgress with the right arguments', async () => {
      // Act
      await service.processAirtelTransactionJob(transactionJob);

      // Assert
      expect(
        transactionJobsHelperService.saveTransactionProgressAndUpdateRelatedData,
      ).toHaveBeenCalledWith({
        context: transactionEventContext,
        description: TransactionEventDescription.airtelRequestSent,
        newTransactionStatus: TransactionStatusEnum.success,
        errorMessage: undefined,
      });
    });
  });

  describe('processAirtelTransactionJob - unhappy path', () => {
    it("should call saveTransactionProcessingProgress with certain arguments when attemptOrCheckDisbursement throws an AirtelError that\'s AirtelDisbursementResultEnum.ambiguous", async () => {
      // Arrange
      (airtelService.attemptOrCheckDisbursement as jest.Mock).mockRejectedValue(
        new AirtelError(
          'mock-ambiguous-message',
          AirtelDisbursementResultEnum.ambiguous,
        ),
      );

      // Act
      await service.processAirtelTransactionJob(transactionJob);

      expect(
        transactionJobsHelperService.saveTransactionProgressAndUpdateRelatedData,
      ).toHaveBeenCalledWith({
        context: transactionEventContext,
        description: TransactionEventDescription.airtelRequestSent,
        newTransactionStatus: TransactionStatusEnum.waiting,
        errorMessage: 'Airtel Error: mock-ambiguous-message',
      });
    });

    it("should call saveTransactionProcessingProgress with certain arguments when attemptOrCheckDisbursement throws an Airtel error that's not ambiguous", async () => {
      // Arrange
      (airtelService.attemptOrCheckDisbursement as jest.Mock).mockRejectedValue(
        new AirtelError('mock-fail-message', AirtelDisbursementResultEnum.fail),
      );

      // Act
      await service.processAirtelTransactionJob(transactionJob);

      expect(
        transactionJobsHelperService.saveTransactionProgressAndUpdateRelatedData,
      ).toHaveBeenCalledWith({
        context: transactionEventContext,
        description: TransactionEventDescription.airtelRequestSent,
        newTransactionStatus: TransactionStatusEnum.error,
        errorMessage: 'Airtel Error: mock-fail-message',
      });
    });

    it('should throw when attemptOrCheckDisbursement throws a non-Airtel error', async () => {
      // Arrange
      const mockErrorMessage = 'mock-misc-error-message';
      (airtelService.attemptOrCheckDisbursement as jest.Mock).mockRejectedValue(
        new Error(mockErrorMessage),
      );

      // Act

      let error: Error | any; // The any is unfortunately needed to prevent type errors
      try {
        await service.processAirtelTransactionJob(transactionJob);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).not.toBeInstanceOf(AirtelError);
      expect(error.message).toBe(mockErrorMessage);
    });
  });
});
