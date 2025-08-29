import { AirtelDisbursementResultEnum } from '@121-service/src/payments/fsp-integration/airtel/enums/airtel-disbursement-result.enum';
import { AirtelError } from '@121-service/src/payments/fsp-integration/airtel/errors/airtel.error';
import { AirtelService } from '@121-service/src/payments/fsp-integration/airtel/services/airtel.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionScopedRepository } from '@121-service/src/payments/transactions/transaction.scoped.repository';
import { TransactionJobsAirtelService } from '@121-service/src/transaction-jobs/services/transaction-jobs-airtel.service';
import { TransactionJobsHelperService } from '@121-service/src/transaction-jobs/services/transaction-jobs-helper.service';
import { AirtelTransactionJobDto } from '@121-service/src/transaction-queues/dto/airtel-transaction-job.dto';

describe('TransactionJobsAirtelService', () => {
  let service: TransactionJobsAirtelService;
  let airtelService: jest.Mocked<AirtelService>;
  let transactionScopedRepository: jest.Mocked<TransactionScopedRepository>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;

  const transactionJob: AirtelTransactionJobDto = {
    projectId: 3,
    projectFspConfigurationId: 3,
    paymentId: 3,
    referenceId: 'ref-3',
    transactionAmount: 300,
    isRetry: false,
    userId: 3,
    bulkSize: 30,
    phoneNumber: '123',
  };

  const registrationId = 7;
  const mockRegistration = {
    id: registrationId,
    firstName: 'Veriko',
    lastName: 'Edgardo',
  };

  beforeEach(async () => {
    airtelService = { attemptOrCheckDisbursement: jest.fn() } as any;
    transactionJobsHelperService = {
      getRegistrationOrThrow: jest.fn().mockResolvedValue(mockRegistration),
      createTransactionAndUpdateRegistration: jest.fn(),
    } as any;
    transactionScopedRepository = {
      // count should return 3
      count: jest.fn().mockResolvedValue(6),
      update: jest.fn(),
    } as any;

    service = new TransactionJobsAirtelService(
      airtelService,
      transactionScopedRepository,
      transactionJobsHelperService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processAirtelTransactionJob - happy path', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call attemptOrCheckDisbursement with the right arguments', async () => {
      // Act
      await service.processAirtelTransactionJob(transactionJob);

      // Assert
      // Deterministic based on input.
      const deterministicAirtelTransactionId =
        'd4ffb98447c80798c9bfca8b466ae9046eff723efaca2de3968947eeca003dfd';
      expect(airtelService.attemptOrCheckDisbursement).toHaveBeenCalledWith({
        airtelTransactionId: deterministicAirtelTransactionId,
        phoneNumber: transactionJob.phoneNumber,
        amount: transactionJob.transactionAmount,
      });
    });

    it('should call attemptOrCheckDisbursement with a different airtelTransactionId if the failedTransactionsCount is different', async () => {
      // Arrange
      (transactionScopedRepository.count as jest.Mock).mockResolvedValue(4);

      // Act
      await service.processAirtelTransactionJob(transactionJob);

      // Assert
      // Different from the previous test.
      const deterministicAirtelTransactionId =
        'c0e886dd4b5c144026222e7fa05ee41f1c952c5277cbdc929a2199b6bb86f018';
      expect(airtelService.attemptOrCheckDisbursement).toHaveBeenCalledWith({
        airtelTransactionId: deterministicAirtelTransactionId,
        phoneNumber: transactionJob.phoneNumber,
        amount: transactionJob.transactionAmount,
      });
    });

    it('should call createTransactionAndUpdateRegistration with the right arguments', async () => {
      // Act
      await service.processAirtelTransactionJob(transactionJob);

      // Assert
      expect(
        transactionJobsHelperService.createTransactionAndUpdateRegistration,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          registration: mockRegistration,
          transactionJob,
          transferAmountInMajorUnit: transactionJob.transactionAmount,
          status: TransactionStatusEnum.success,
          errorText: undefined,
        }),
      );
    });
  });

  describe('processAirtelTransactionJob - unhappy path', () => {
    it("should call createTransactionAndUpdateRegistration with certain arguments when attemptOrCheckDisbursement throws an AirtelError that\'s AirtelDisbursementResultEnum.ambiguous", async () => {
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
        transactionJobsHelperService.createTransactionAndUpdateRegistration,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          registration: mockRegistration,
          transactionJob,
          transferAmountInMajorUnit: transactionJob.transactionAmount,
          status: TransactionStatusEnum.waiting,
          errorText: 'Airtel Error: mock-ambiguous-message',
        }),
      );
    });

    it("should call createTransactionAndUpdateRegistration with certain arguments when attemptOrCheckDisbursement throws an Airtel error that's not ambiguous", async () => {
      // Arrange
      (airtelService.attemptOrCheckDisbursement as jest.Mock).mockRejectedValue(
        new AirtelError('mock-fail-message', AirtelDisbursementResultEnum.fail),
      );

      // Act
      await service.processAirtelTransactionJob(transactionJob);

      expect(
        transactionJobsHelperService.createTransactionAndUpdateRegistration,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          registration: mockRegistration,
          transactionJob,
          transferAmountInMajorUnit: transactionJob.transactionAmount,
          status: TransactionStatusEnum.error,
          errorText: 'Airtel Error: mock-fail-message',
        }),
      );
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
