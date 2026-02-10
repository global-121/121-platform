import { Test, TestingModule } from '@nestjs/testing';

import { CommercialBankEthiopiaApiService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia.api.service';
import { CommercialBankEthiopiaApiClientService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia-api-client.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
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

const mockXmlPayload = {
  elements: [
    {
      name: 'soapenv:Envelope',
      elements: [
        {
          name: 'soapenv:Body',
          elements: [
            {
              name: 'cber:RMTFundtransfer',
              elements: [
                {
                  name: 'WebRequestCommon',
                  elements: [
                    { name: 'password', elements: [{ text: '' }] },
                    { name: 'userName', elements: [{ text: '' }] },
                  ],
                },
                {
                  name: 'FUNDSTRANSFERCBEREMITANCEType',
                  elements: [
                    { name: 'fun:DEBITAMOUNT', elements: [{ text: '' }] },
                    { name: 'fun:DEBITTHEIRREF', elements: [{ text: '' }] },
                    { name: 'fun:CREDITTHEIRREF', elements: [{ text: '' }] },
                    { name: 'fun:CREDITACCTNO', elements: [{ text: '' }] },
                    { name: 'fun:CREDITCURRENCY', elements: [{ text: '' }] },
                    { name: 'fun:RemitterName', elements: [{ text: '' }] },
                    { name: 'fun:BeneficiaryName', elements: [{ text: '' }] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe('CommercialBankEthiopiaApiService', () => {
  let service: CommercialBankEthiopiaApiService;
  let commercialBankEthiopiaApiClientService: CommercialBankEthiopiaApiClientService;
  let soapService: SoapService;
  let makeApiRequest: jest.Mock;
  let readXmlAsJs: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommercialBankEthiopiaApiService,
        {
          provide: CommercialBankEthiopiaApiClientService,
          useValue: {
            makeApiRequest: jest.fn(),
          },
        },
        {
          provide: SoapService,
          useValue: {
            readXmlAsJs: jest.fn(),
          },
        },
        {
          provide: CustomHttpService,
          useValue: {
            request: jest.fn(),
            createHttpsAgentWithSelfSignedCertificateOnly: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CommercialBankEthiopiaApiService>(
      CommercialBankEthiopiaApiService,
    );
    soapService = module.get<SoapService>(SoapService);
    commercialBankEthiopiaApiClientService =
      module.get<CommercialBankEthiopiaApiClientService>(
        CommercialBankEthiopiaApiClientService,
      );
    makeApiRequest =
      commercialBankEthiopiaApiClientService.makeApiRequest as jest.Mock;
    readXmlAsJs = soapService.readXmlAsJs as jest.Mock;

    // Mock readXmlAsJs to return a valid payload structure
    readXmlAsJs.mockResolvedValue(mockXmlPayload);

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // Suppress console output in tests
    });
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
  });

  describe('creditTransfer', () => {
    it('should successfully complete a credit transfer (happy flow)', async () => {
      // Arrange
      makeApiRequest.mockResolvedValue(mockSuccessResponse);

      // Act
      const result = await service.creditTransfer(mockPayment, mockCredentials);

      // Assert
      expect(makeApiRequest).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should handle CBE connection error or timeout (ECONNRESET)', async () => {
      // Arrange
      const connectionError = new Error('Connection reset by peer');
      (connectionError as any).code = 'ECONNRESET';
      makeApiRequest.mockRejectedValue(connectionError);

      // Act
      const result = await service.creditTransfer(mockPayment, mockCredentials);

      // Assert
      expect(result.resultDescription).toMatchInlineSnapshot(
        `"Failed because of CBE connection error or timeout (ECONNRESET). Please try again later."`,
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `CBE API: CreditTransfer - Connection error or timeout: ECONNRESET`,
      );
    });
  });
});
