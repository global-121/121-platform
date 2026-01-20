import { Test, TestingModule } from '@nestjs/testing';

import { CommercialBankEthiopiaApiService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { SoapService } from '@121-service/src/utils/soap/soap.service';

const mockPayment = {
  debitAmount: 100,
  debitTheirRef: 'test-ref-123',
  creditTheirRef: 'credit-ref-456',
  creditAcctNo: '1234567890',
  creditCurrency: 'ETB',
  remitterName: 'Test Remitter',
  beneficiaryName: 'Test Beneficiary',
};

const mockCredentials = {
  username: 'test-user',
  password: 'test-password',
};

const mockSuccessResponse = {
  Status: {
    successIndicator: {
      _text: 'Success',
    },
  },
  TransactionId: 'TXN123456',
};

describe('CommercialBankEthiopiaApiService', () => {
  let service: CommercialBankEthiopiaApiService;
  let soapService: SoapService;
  let postCBERequest: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommercialBankEthiopiaApiService,
        {
          provide: SoapService,
          useValue: {
            postCBERequest: jest.fn(),
            readXmlAsJs: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CommercialBankEthiopiaApiService>(
      CommercialBankEthiopiaApiService,
    );
    soapService = module.get<SoapService>(SoapService);
    postCBERequest = soapService.postCBERequest as jest.Mock;
  });

  describe('creditTransfer', () => {
    it('should successfully complete a credit transfer (happy flow)', async () => {
      // Arrange
      postCBERequest.mockResolvedValue(mockSuccessResponse);

      // Act
      const result = await service.creditTransfer(mockPayment, mockCredentials);

      // Assert
      expect(postCBERequest).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle CBE connection error or timeout (ECONNRESET)', async () => {
      // Arrange
      const connectionError = new Error('Connection reset by peer');
      (connectionError as any).code = 'ECONNRESET';
      postCBERequest.mockRejectedValue(connectionError);

      // Act
      const result = await service.creditTransfer(mockPayment, mockCredentials);

      // Assert
      expect(result.resultDescription).toMatchInlineSnapshot(
        `"Failed because of CBE connection error or timeout. Please try again later."`,
      );
    });
  });
});
