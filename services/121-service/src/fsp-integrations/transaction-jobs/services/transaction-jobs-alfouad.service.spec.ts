import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.service';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { TransactionJobsAlfouadService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-alfouad.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { AlfouadTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/alfouad-transaction-job.dto';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionEventDescription } from '@121-service/src/payments/transactions/transaction-events/enum/transaction-event-description.enum';
import { TransactionEventsScopedRepository } from '@121-service/src/payments/transactions/transaction-events/repositories/transaction-events.scoped.repository';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

const requestIdentity: AlfouadRequestIdentity = {
  account: '161010004501',
  branchId: '1',
  username: 'Red Crescent',
  password: 'secret',
  publicKey: '<RSAParameters />',
};

const transactionJob: AlfouadTransactionJobDto = {
  referenceId: 'ref-1',
  transactionId: 1,
  programId: 1,
  userId: 1,
  bulkSize: 10,
  transferValue: 10000,
  programFspConfigurationId: 1,
  isRetry: false,
  senderFullName: 'Red Crescent',
  senderPhoneNumber: '0900000000',
  beneficiaryFullName: 'Test Beneficiary',
  beneficiaryPhoneNumber: '0911111111',
  countryCode: 'SY',
  cityCode: 'Damascus',
  deliveryCurrencyCode: 'SYP',
};

describe('TransactionJobsAlfouadService', () => {
  let service: TransactionJobsAlfouadService;
  let alfouadService: jest.Mocked<AlfouadService>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;
  let transactionEventScopedRepository: jest.Mocked<TransactionEventsScopedRepository>;
  let transactionsService: jest.Mocked<TransactionsService>;

  beforeEach(() => {
    alfouadService = {
      getAlfouadFspConfig: jest.fn().mockResolvedValue(requestIdentity),
      createTransaction: jest.fn(),
    } as any;
    transactionJobsHelperService = {
      logTransactionJobStart: jest.fn(),
    } as any;
    transactionEventScopedRepository = {
      countFailedTransactionAttempts: jest.fn().mockResolvedValue(0),
    } as any;
    transactionsService = { saveProgress: jest.fn() } as any;

    service = new TransactionJobsAlfouadService(
      alfouadService,
      transactionJobsHelperService,
      transactionEventScopedRepository,
      transactionsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processTransactionJob', () => {
    it('should log the job start and create the transaction with a generated reference number', async () => {
      // Arrange
      alfouadService.createTransaction.mockResolvedValue(undefined);

      // Act
      await service.processTransactionJob(transactionJob);

      // Assert
      expect(
        transactionJobsHelperService.logTransactionJobStart,
      ).toHaveBeenCalledWith({
        context: {
          transactionId: transactionJob.transactionId,
          userId: transactionJob.userId,
          programFspConfigurationId: transactionJob.programFspConfigurationId,
        },
        isRetry: transactionJob.isRetry,
      });
      expect(alfouadService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          senderFullName: transactionJob.senderFullName,
          beneficiaryFullName: transactionJob.beneficiaryFullName,
          referenceNumber: expect.any(String),
          deliveryAmount: transactionJob.transferValue,
          requestIdentity,
        }),
      );
    });

    it('should leave the transaction on waiting with a success event when the transaction is created', async () => {
      // Arrange
      alfouadService.createTransaction.mockResolvedValue(undefined);

      // Act
      await service.processTransactionJob(transactionJob);

      // Assert
      expect(transactionsService.saveProgress).toHaveBeenCalledWith({
        context: {
          transactionId: transactionJob.transactionId,
          userId: transactionJob.userId,
          programFspConfigurationId: transactionJob.programFspConfigurationId,
        },
        description: TransactionEventDescription.alfouadRequestSent,
      });
    });

    it('should set the transaction to error with a failed event when an AlfouadApiError is thrown', async () => {
      // Arrange
      alfouadService.createTransaction.mockRejectedValue(
        new AlfouadApiError({ message: 'Rejected by Al Fouad' }),
      );

      // Act
      await service.processTransactionJob(transactionJob);

      // Assert
      expect(transactionsService.saveProgress).toHaveBeenCalledWith({
        context: {
          transactionId: transactionJob.transactionId,
          userId: transactionJob.userId,
          programFspConfigurationId: transactionJob.programFspConfigurationId,
        },
        description: TransactionEventDescription.alfouadRequestSent,
        errorMessage: 'Rejected by Al Fouad',
        newTransactionStatus: TransactionStatusEnum.error,
      });
    });

    it('should rethrow and not save error progress on a non-AlfouadApiError (timeout / no response)', async () => {
      // Arrange
      const networkError = new Error('network down');
      alfouadService.createTransaction.mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.processTransactionJob(transactionJob)).rejects.toBe(
        networkError,
      );
      expect(transactionsService.saveProgress).not.toHaveBeenCalledWith(
        expect.objectContaining({
          newTransactionStatus: TransactionStatusEnum.error,
        }),
      );
    });
  });
});
