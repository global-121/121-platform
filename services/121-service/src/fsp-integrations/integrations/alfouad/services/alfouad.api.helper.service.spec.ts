import { Test, TestingModule } from '@nestjs/testing';

import { env } from '@121-service/src/env';
import { AlfouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.helper.service';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';

jest.mock('@121-service/src/env', () => ({
  env: {
    ALFOUAD_MODE: 'MOCK', // String literal to avoid using FspMode before jest.mock is initialized
    MOCK_SERVICE_URL: 'http://mock-service:3001',
    ALFOUAD_API_URL: 'https://alfouad.example.org',
  },
}));

describe('AlfouadApiHelperService', () => {
  let service: AlfouadApiHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlfouadApiHelperService],
    }).compile();

    service = module.get<AlfouadApiHelperService>(AlfouadApiHelperService);

    (env as any).ALFOUAD_MODE = FspMode.mock;
    (env as any).MOCK_SERVICE_URL = 'http://mock-service:3001';
    (env as any).ALFOUAD_API_URL = 'https://alfouad.example.org';
  });

  describe('getBaseUrl', () => {
    it('should return the mock service URL when ALFOUAD_MODE is mock', () => {
      // Arrange
      (env as any).ALFOUAD_MODE = FspMode.mock;

      // Act
      const result = service.getBaseUrl();

      // Assert
      expect(result.toString()).toBe(
        'http://mock-service:3001/api/fsp/alfouad/',
      );
    });

    it('should return the Al Fouad API URL when ALFOUAD_MODE is external', () => {
      // Arrange
      (env as any).ALFOUAD_MODE = FspMode.external;
      (env as any).ALFOUAD_API_URL = 'https://alfouad.example.org';

      // Act
      const result = service.getBaseUrl();

      // Assert
      expect(result.toString()).toBe('https://alfouad.example.org/');
    });

    it('should throw when external and ALFOUAD_API_URL is not set', () => {
      // Arrange
      (env as any).ALFOUAD_MODE = FspMode.external;
      (env as any).ALFOUAD_API_URL = undefined;

      // Act & Assert
      expect(() => service.getBaseUrl()).toThrow('ALFOUAD_API_URL is not set');
    });
  });

  describe('buildAuthorizationValue', () => {
    it('should Base64-encode the Authentication XML', () => {
      // Act
      const value = service.buildAuthorizationValue({
        account: '161010004501',
        branchId: '1',
        username: 'Red Crescent',
        encryptedPassword: 'encrypted==',
      });

      // Assert
      const xml = Buffer.from(value, 'base64').toString('utf8');
      expect(xml).toBe(
        '<Authentication>' +
        '<Account>161010004501</Account>' +
        '<BranchId>1</BranchId>' +
        '<UserName>Red Crescent</UserName>' +
        '<Password>encrypted==</Password>' +
        '</Authentication>',
      );
    });

    it('should escape XML-special characters in the values', () => {
      // Act
      const value = service.buildAuthorizationValue({
        account: '1',
        branchId: '1',
        username: 'A & B <x>',
        encryptedPassword: 'p',
      });

      // Assert
      const xml = Buffer.from(value, 'base64').toString('utf8');
      expect(xml).toContain('<UserName>A &amp; B &lt;x&gt;</UserName>');
    });
  });

  describe('createRequestHeaders', () => {
    it('should set the Bearer token and JSON content-type headers', () => {
      // Act
      const headers = service.createRequestHeaders({
        authorizationValue: 'abc123',
      });

      // Assert
      expect(headers.get('Authorization')).toBe('Bearer abc123');
      expect(headers.get('Accept')).toBe('application/json');
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('createTransactionPayload', () => {
    const baseParams = {
      senderFullName: 'Test Sender',
      senderPhoneNumber: '0900000000',
      beneficiaryFullName: 'Test Beneficiary',
      beneficiaryPhoneNumber: '0911111111',
      referenceNumber: 'RC-TEST-1',
      countryCode: 'SY',
      cityCode: 'Damascus',
      deliveryCurrencyCode: 'SYP',
      deliveryAmount: 10000,
      reasonCode: 'Personal remittances',
    };

    it('should map the params to the Al Fouad request body', () => {
      // Act
      const payload = service.createTransactionPayload({
        ...baseParams,
        agentCode: 5,
      });

      // Assert
      expect(payload).toEqual({
        SenderFullName: 'Test Sender',
        SenderPhoneNumber: '0900000000',
        BeneficiaryFullName: 'Test Beneficiary',
        BeneficiaryPhoneNumber: '0911111111',
        ReferenceNumber: 'RC-TEST-1',
        CountryCode: 'SY',
        CityCode: 'Damascus',
        AgentCode: 5,
        DeliveryCurrencyCode: 'SYP',
        DeliveryAmount: 10000,
        ReasonCode: 'Personal remittances',
      });
    });

    it('should default AgentCode to cash-pickup-anywhere (0) when omitted', () => {
      // Act
      const payload = service.createTransactionPayload(baseParams);

      // Assert
      expect(payload.AgentCode).toBe(0);
    });
  });
});
