import { Test, TestingModule } from '@nestjs/testing';
import https from 'node:https';

import { env } from '@121-service/src/env';
import { CommercialBankEthiopiaApiClientService } from '@121-service/src/fsp-integrations/integrations/commercial-bank-ethiopia/services/commercial-bank-ethiopia-api-client.service';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('@121-service/src/env', () => ({
  env: {
    COMMERCIAL_BANK_ETHIOPIA_MODE: 'mock',
    COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH: '',
  },
}));

describe('CommercialBankEthiopiaApiClientService', () => {
  let httpService: CustomHttpService;

  beforeEach(async () => {
    // Reset env values before each test
    (env.COMMERCIAL_BANK_ETHIOPIA_MODE as any) = FspMode.mock;
    (env.COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH as any) = '';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommercialBankEthiopiaApiClientService,
        {
          provide: CustomHttpService,
          useValue: {
            createHttpsAgentWithWeakSelfSignedCertificateOnly: jest.fn(),
            logMessageRequest: jest.fn(),
            logErrorRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    httpService = module.get<CustomHttpService>(CustomHttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createHttpsAgent (via constructor)', () => {
    it('should create a default HTTPS agent when mode is not external', () => {
      // Arrange
      (env.COMMERCIAL_BANK_ETHIOPIA_MODE as any) = FspMode.mock;
      (env.COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH as any) = '';

      // Act - createHttpsAgent is called in constructor
      new CommercialBankEthiopiaApiClientService(httpService);

      // Assert
      expect(
        httpService.createHttpsAgentWithWeakSelfSignedCertificateOnly,
      ).not.toHaveBeenCalled(); // Unfortunately we can't directly check the creation of the default https.Agent since it's private and we therefore have to test the internal working of this method to see if createHttpsAgentWithWeakSelfSignedCertificateOnly is called or not
    });

    it('should create an HTTPS agent with certificate when mode is external and certificate path is provided', () => {
      // Arrange
      const mockAgent = {} as https.Agent;
      const certificatePath = '/path/to/cert.pem';
      (env.COMMERCIAL_BANK_ETHIOPIA_MODE as any) = FspMode.external;
      (env.COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH as any) = certificatePath;

      jest
        .spyOn(httpService, 'createHttpsAgentWithWeakSelfSignedCertificateOnly')
        .mockReturnValue(mockAgent);

      // Act - createHttpsAgent is called in constructor
      new CommercialBankEthiopiaApiClientService(httpService);

      // Assert
      expect(
        httpService.createHttpsAgentWithWeakSelfSignedCertificateOnly,
      ).toHaveBeenCalledWith(certificatePath, { keepAlive: true }); // Unfortunately we can't directly check the creation of the default https.Agent since it's private and we therefore have to test the internal working of this method to see if createHttpsAgentWithWeakSelfSignedCertificateOnly is called or not
    });

    it('should create a default HTTPS agent when mode is external but certificate path is not provided', () => {
      // This scenario is relevant for the CBE Acceptance environment, where we want to use the external mode but do not use a certificate

      // Arrange
      (env.COMMERCIAL_BANK_ETHIOPIA_MODE as any) = FspMode.external;
      (env.COMMERCIAL_BANK_ETHIOPIA_CERTIFICATE_PATH as any) = '';

      // Act - createHttpsAgent is called in constructor
      new CommercialBankEthiopiaApiClientService(httpService);

      // Assert
      expect(
        httpService.createHttpsAgentWithWeakSelfSignedCertificateOnly,
      ).not.toHaveBeenCalled(); // Unfortunately we can't directly check the creation of the default https.Agent since it's private and we therefore have to test the internal working of this method to see if createHttpsAgentWithWeakSelfSignedCertificateOnly is called or not
    });
  });
});
