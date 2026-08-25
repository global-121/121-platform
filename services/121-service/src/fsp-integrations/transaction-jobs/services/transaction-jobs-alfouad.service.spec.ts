import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { AlfouadService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.service';
import { TransactionJobsAlfouadService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-alfouad.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { AlfouadTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/alfouad-transaction-job.dto';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

const requestIdentity: AlfouadRequestIdentity = {
  account: '161010004501',
  branchId: '1',
  username: 'Red Crescent',
  password: 'secret',
  publicKey: '<RSAParameters />',
  senderFullName: 'Red Crescent',
  senderPhoneNumber: '0900000000',
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
  registrationFullName: 'Test Beneficiary',
  registrationPhoneNumber: '0911111111',
};

describe('TransactionJobsAlfouadService', () => {
  let service: TransactionJobsAlfouadService;
  let alfouadService: jest.Mocked<AlfouadService>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;
  let transactionsService: jest.Mocked<TransactionsService>;

  beforeEach(() => {
    alfouadService = {
      getAlfouadFspConfig: jest.fn().mockResolvedValue(requestIdentity),
      generateReferenceNumber: jest.fn().mockResolvedValue('reference-number'),
      createTransaction: jest.fn(),
    } as any;
    transactionJobsHelperService = { logTransactionJobStart: jest.fn() } as any;
    transactionsService = { saveProgress: jest.fn() } as any;

    service = new TransactionJobsAlfouadService(
      alfouadService,
      transactionJobsHelperService,
      transactionsService,
    );
  });

  describe('Processing a transaction job', () => {
    it('should send the transaction to Al Fouad', async () => {
      // Arrange
      alfouadService.createTransaction.mockResolvedValue(undefined);

      // Act
      await service.processTransactionJob(transactionJob);

      // Assert
      expect(alfouadService.createTransaction).toHaveBeenCalled();
    });

    it('should rethrow and not save error progress on a non-AlfouadApiError (timeout / no response)', async () => {
      // Arrange
      const networkError = new Error('network down');
      alfouadService.createTransaction.mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.processTransactionJob(transactionJob)).rejects.toBe(
        networkError,
      );
      expect(transactionsService.saveProgress).not.toHaveBeenCalled();
    });
  });
});
