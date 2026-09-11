import { AlFouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-auth-identity.interface';
import { AlFouadSenderInfo } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-sender-info.interface';
import { AlFouadService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.service';
import { TransactionJobsAlFouadService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-al-fouad.service';
import { TransactionJobsHelperService } from '@121-service/src/fsp-integrations/transaction-jobs/services/transaction-jobs-helper.service';
import { AlFouadTransactionJobDto } from '@121-service/src/fsp-integrations/transaction-queues/dto/al-fouad-transaction-job.dto';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';

const authIdentity: AlFouadAuthIdentity = {
  account: '161010004501',
  branchId: '1',
  username: 'Red Crescent',
  password: 'secret',
  publicKey: '<RSAParameters />',
};

const senderInfo: AlFouadSenderInfo = {
  senderFullName: 'Red Crescent',
  senderPhoneNumber: '0900000000',
};

const transactionJob: AlFouadTransactionJobDto = {
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

describe('TransactionJobsAlFouadService', () => {
  let service: TransactionJobsAlFouadService;
  let alFouadService: jest.Mocked<AlFouadService>;
  let transactionJobsHelperService: jest.Mocked<TransactionJobsHelperService>;
  let transactionsService: jest.Mocked<TransactionsService>;

  beforeEach(() => {
    alFouadService = {
      getAlFouadFspConfig: jest
        .fn()
        .mockResolvedValue({ authIdentity, senderInfo }),
      generateReferenceNumber: jest.fn().mockResolvedValue('reference-number'),
      createTransaction: jest.fn(),
    } as any;
    transactionJobsHelperService = { logTransactionJobStart: jest.fn() } as any;
    transactionsService = { saveProgress: jest.fn() } as any;

    service = new TransactionJobsAlFouadService(
      alFouadService,
      transactionJobsHelperService,
      transactionsService,
    );
  });

  describe('Processing a transaction job', () => {
    it('should send the transaction to Al Fouad', async () => {
      // Arrange
      alFouadService.createTransaction.mockResolvedValue(undefined);

      // Act
      await service.processTransactionJob(transactionJob);

      // Assert
      expect(alFouadService.createTransaction).toHaveBeenCalled();
    });

    it('should rethrow and not save error progress on a non-AlFouadApiError (timeout / no response)', async () => {
      // Arrange
      const networkError = new Error('network down');
      alFouadService.createTransaction.mockRejectedValue(networkError);

      // Act & Assert
      await expect(service.processTransactionJob(transactionJob)).rejects.toBe(
        networkError,
      );
      expect(transactionsService.saveProgress).not.toHaveBeenCalled();
    });
  });
});
