import { Test, TestingModule } from '@nestjs/testing';

import { env } from '@121-service/src/env';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnApiHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.helper.service';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';

jest.mock('@121-service/src/env', () => ({
  env: {
    MTN_MODE: 'MOCK',
    MOCK_SERVICE_URL: 'http://mock-service:3001',
    MTN_API_URL: 'https://sandbox.momodeveloper.mtn.com',
    MTN_SUBSCRIPTION_KEY: 'test-subscription-key',
    MTN_ACCESS_TOKEN: 'test-access-token',
    MTN_TARGET_ENVIRONMENT: 'sandbox',
    EXTERNAL_121_SERVICE_URL: 'http://localhost:3000',
  },
}));

describe('MtnApiHelperService', () => {
  let mtnApiHelperService: MtnApiHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MtnApiHelperService],
    }).compile();

    mtnApiHelperService = module.get<MtnApiHelperService>(MtnApiHelperService);

    // Reset env values before each test
    (env as any).MTN_MODE = FspMode.mock;
    (env as any).MOCK_SERVICE_URL = 'http://mock-service:3001';
    (env as any).MTN_API_URL = 'https://sandbox.momodeveloper.mtn.com';
    (env as any).MTN_SUBSCRIPTION_KEY = 'test-subscription-key';
    (env as any).MTN_ACCESS_TOKEN = 'test-access-token';
    (env as any).MTN_TARGET_ENVIRONMENT = 'sandbox';
    (env as any).EXTERNAL_121_SERVICE_URL = 'http://localhost:3000';
  });

  describe('getBaseUrl', () => {
    it('should return mock service URL when MTN_MODE is mock', () => {
      (env as any).MTN_MODE = FspMode.mock;

      const result = mtnApiHelperService.getBaseUrl();

      expect(result.toString()).toBe('http://mock-service:3001/api/fsp/mtn/');
    });

    it('should return MTN API URL when MTN_MODE is not mock', () => {
      (env as any).MTN_MODE = 'LIVE';
      (env as any).MTN_API_URL = 'https://sandbox.momodeveloper.mtn.com';

      const result = mtnApiHelperService.getBaseUrl();

      expect(result.toString()).toBe('https://sandbox.momodeveloper.mtn.com/');
    });

    it('should throw MtnApiError when MTN_MODE is not mock and MTN_API_URL is not set', () => {
      (env as any).MTN_MODE = 'LIVE';
      (env as any).MTN_API_URL = '';

      expect(() => mtnApiHelperService.getBaseUrl()).toThrow(MtnApiError);
      expect(() => mtnApiHelperService.getBaseUrl()).toThrow(
        'MTN_API_URL is not set',
      );
    });
  });

  describe('createTransferPayload', () => {
    it('should return a correctly structured transfer payload', () => {
      const result = mtnApiHelperService.createTransferPayload({
        referenceId: 'ref-123',
        amount: '100',
        currency: 'EUR',
        externalId: '42',
        payee: {
          partyIdType: 'MSISDN',
          partyId: '256771234567',
        },
        payerMessage: 'Payment message',
        payeeNote: 'Payment note',
      });

      expect(result).toEqual({
        amount: '100',
        currency: 'EUR',
        externalId: '42',
        payee: {
          partyIdType: 'MSISDN',
          partyId: '256771234567',
        },
        payerMessage: 'Payment message',
        payeeNote: 'Payment note',
      });
    });

    it('should not include referenceId in the payload', () => {
      const result = mtnApiHelperService.createTransferPayload({
        referenceId: 'ref-123',
        amount: '50',
        currency: 'USD',
        externalId: '1',
        payee: {
          partyIdType: 'MSISDN',
          partyId: '256770000000',
        },
        payerMessage: 'msg',
        payeeNote: 'note',
      });

      expect(result).not.toHaveProperty('referenceId');
    });
  });

  describe('createTransferHeaders', () => {
    it('should return headers with all required fields', () => {
      const headers = mtnApiHelperService.createTransferHeaders({
        referenceId: 'ref-uuid-123',
      });

      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Cache-Control')).toBe('no-cache');
      expect(headers.get('Ocp-Apim-Subscription-Key')).toBe(
        'test-subscription-key',
      );
      expect(headers.get('Authorization')).toBe('Bearer test-access-token');
      expect(headers.get('X-Reference-Id')).toBe('ref-uuid-123');
      expect(headers.get('X-Target-Environment')).toBe('sandbox');
    });

    it('should include X-Callback-Url when EXTERNAL_121_SERVICE_URL is set', () => {
      const headers = mtnApiHelperService.createTransferHeaders({
        referenceId: 'ref-uuid-123',
      });

      expect(headers.get('X-Callback-Url')).toBe(
        'http://localhost:3000/api/fsps/mtn/transfer-callback',
      );
    });

    it('should not include X-Callback-Url when EXTERNAL_121_SERVICE_URL is empty', () => {
      (env as any).EXTERNAL_121_SERVICE_URL = '';

      const headers = mtnApiHelperService.createTransferHeaders({
        referenceId: 'ref-uuid-123',
      });

      expect(headers.get('X-Callback-Url')).toBeNull();
    });

    it('should throw MtnApiError when MTN_ACCESS_TOKEN is not set', () => {
      (env as any).MTN_ACCESS_TOKEN = '';

      expect(() =>
        mtnApiHelperService.createTransferHeaders({
          referenceId: 'ref-uuid-123',
        }),
      ).toThrow(MtnApiError);
      expect(() =>
        mtnApiHelperService.createTransferHeaders({
          referenceId: 'ref-uuid-123',
        }),
      ).toThrow('MTN_ACCESS_TOKEN is not set');
    });

    it('should throw MtnApiError when MTN_TARGET_ENVIRONMENT is not set', () => {
      (env as any).MTN_TARGET_ENVIRONMENT = '';

      expect(() =>
        mtnApiHelperService.createTransferHeaders({
          referenceId: 'ref-uuid-123',
        }),
      ).toThrow(MtnApiError);
      expect(() =>
        mtnApiHelperService.createTransferHeaders({
          referenceId: 'ref-uuid-123',
        }),
      ).toThrow('MTN_TARGET_ENVIRONMENT is not set');
    });

    it('should throw MtnApiError when MTN_SUBSCRIPTION_KEY is not set', () => {
      (env as any).MTN_SUBSCRIPTION_KEY = '';

      expect(() =>
        mtnApiHelperService.createTransferHeaders({
          referenceId: 'ref-uuid-123',
        }),
      ).toThrow(MtnApiError);
      expect(() =>
        mtnApiHelperService.createTransferHeaders({
          referenceId: 'ref-uuid-123',
        }),
      ).toThrow('MTN_SUBSCRIPTION_KEY is not set');
    });
  });

  describe('createGetTransferStatusHeaders', () => {
    it('should return headers with all required fields', () => {
      const headers = mtnApiHelperService.createGetTransferStatusHeaders();

      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Cache-Control')).toBe('no-cache');
      expect(headers.get('Ocp-Apim-Subscription-Key')).toBe(
        'test-subscription-key',
      );
      expect(headers.get('Authorization')).toBe('Bearer test-access-token');
      expect(headers.get('X-Target-Environment')).toBe('sandbox');
    });

    it('should not include X-Reference-Id or X-Callback-Url', () => {
      const headers = mtnApiHelperService.createGetTransferStatusHeaders();

      expect(headers.get('X-Reference-Id')).toBeNull();
      expect(headers.get('X-Callback-Url')).toBeNull();
    });

    it('should throw MtnApiError when MTN_ACCESS_TOKEN is not set', () => {
      (env as any).MTN_ACCESS_TOKEN = '';

      expect(() =>
        mtnApiHelperService.createGetTransferStatusHeaders(),
      ).toThrow(MtnApiError);
      expect(() =>
        mtnApiHelperService.createGetTransferStatusHeaders(),
      ).toThrow('MTN_ACCESS_TOKEN is not set');
    });

    it('should throw MtnApiError when MTN_TARGET_ENVIRONMENT is not set', () => {
      (env as any).MTN_TARGET_ENVIRONMENT = '';

      expect(() =>
        mtnApiHelperService.createGetTransferStatusHeaders(),
      ).toThrow(MtnApiError);
      expect(() =>
        mtnApiHelperService.createGetTransferStatusHeaders(),
      ).toThrow('MTN_TARGET_ENVIRONMENT is not set');
    });

    it('should throw MtnApiError when MTN_SUBSCRIPTION_KEY is not set', () => {
      (env as any).MTN_SUBSCRIPTION_KEY = '';

      expect(() =>
        mtnApiHelperService.createGetTransferStatusHeaders(),
      ).toThrow(MtnApiError);
      expect(() =>
        mtnApiHelperService.createGetTransferStatusHeaders(),
      ).toThrow('MTN_SUBSCRIPTION_KEY is not set');
    });
  });
});
