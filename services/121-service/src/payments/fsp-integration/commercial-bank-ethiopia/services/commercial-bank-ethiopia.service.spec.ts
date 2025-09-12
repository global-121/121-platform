import { TestBed } from '@automock/jest';

import { CreateCreditTransferOrGetTransactionStatusParams } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/interfaces/create-credit-transfer-or-get-transaction-status-params.interface';
import { CommercialBankEthiopiaApiService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaService } from '@121-service/src/payments/fsp-integration/commercial-bank-ethiopia/services/commercial-bank-ethiopia.service';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { UsernamePasswordInterface } from '@121-service/src/program-fsp-configurations/interfaces/username-password.interface';

describe('CommercialBankEthiopiaService', () => {
  let commercialBankEthiopiaService: CommercialBankEthiopiaService;

  beforeEach(() => {
    const { unit } = TestBed.create(CommercialBankEthiopiaService).compile();

    commercialBankEthiopiaService = unit;
  });

  it('should be defined', () => {
    expect(commercialBankEthiopiaService).toBeDefined();
  });

  describe('createCreditTransferOrGetTransactionStatus', () => {
    let service: CommercialBankEthiopiaService;
    let apiService: jest.Mocked<CommercialBankEthiopiaApiService>;

    const credentials: UsernamePasswordInterface = {
      username: 'user',
      password: 'pass',
    };
    const inputParams: CreateCreditTransferOrGetTransactionStatusParams = {
      debitTheirRef: 'ref123',
      bankAccountNumber: 'acc123',
      currency: 'ETB',
      ngoName: 'NGO',
      titlePortal: { en: 'Title' },
      fullName: 'John Doe',
      amount: 100,
    };

    beforeEach(() => {
      apiService = {
        creditTransfer: jest.fn(),
        getTransactionStatus: jest.fn(),
      } as any;
      const { unit } = TestBed.create(CommercialBankEthiopiaService)
        .mock(CommercialBankEthiopiaApiService)
        .using(apiService)
        .compile();
      service = unit;
    });

    it('should return success if creditTransfer returns success', async () => {
      apiService.creditTransfer.mockResolvedValue({
        Status: { successIndicator: { _text: 'Success' } },
      });
      const result = await service.createCreditTransferOrGetTransactionStatus({
        inputParams,
        credentials,
      });
      expect(result.status).toBe(TransactionStatusEnum.success);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should call getTransactionStatus if resultDescription is DUPLICATED', async () => {
      apiService.creditTransfer.mockResolvedValue({
        resultDescription: 'Transaction is DUPLICATED',
      });
      apiService.getTransactionStatus.mockResolvedValue({
        Status: { successIndicator: { _text: 'Success' } },
      });
      const result = await service.createCreditTransferOrGetTransactionStatus({
        inputParams,
        credentials,
      });
      expect(apiService.getTransactionStatus).toHaveBeenCalled();
      expect(result.status).toBe(TransactionStatusEnum.success);
    });

    it('should return error and errorMessage if not success', async () => {
      apiService.creditTransfer.mockResolvedValue({
        Status: { successIndicator: { _text: 'Error' } },
        resultDescription: 'Some error',
      });
      const result = await service.createCreditTransferOrGetTransactionStatus({
        inputParams,
        credentials,
      });
      expect(result.status).toBe(TransactionStatusEnum.error);
      expect(result.errorMessage).toBe('Some error');
    });
  });
});
