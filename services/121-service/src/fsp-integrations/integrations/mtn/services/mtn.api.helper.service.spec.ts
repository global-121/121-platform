import { Test, TestingModule } from '@nestjs/testing';

import { env } from '@121-service/src/env';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnApiHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.helper.service';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';

jest.mock('@121-service/src/env', () => ({
  env: {
    MTN_MODE: 'MOCK', // Default to mock mode without imported FspMode to avoid issues with jest.mock not being initialized when beforeEach is executed
    MOCK_SERVICE_URL: 'http://mock-service:3001',
    MTN_API_URL: 'https://sandbox.momodeveloper.mtn.com',
    MTN_SUBSCRIPTION_KEY: 'test-subscription-key',
    MTN_REFERENCE_ID: 'test-reference-id',
    MTN_API_KEY: 'test-api-key',
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
    (env as any).MTN_REFERENCE_ID = 'test-reference-id';
    (env as any).MTN_API_KEY = 'test-api-key';
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
      (env as any).MTN_MODE = FspMode.external;
      (env as any).MTN_API_URL = 'https://sandbox.momodeveloper.mtn.com';

      const result = mtnApiHelperService.getBaseUrl();

      expect(result.toString()).toBe('https://sandbox.momodeveloper.mtn.com/');
    });

    it('should throw MtnApiError when MTN_MODE is not mock and MTN_API_URL is not set', () => {
      (env as any).MTN_MODE = FspMode.external;
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
        subscriptionKey: 'test-subscription-key',
      });

      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Cache-Control')).toBe('no-cache');
      expect(headers.get('Ocp-Apim-Subscription-Key')).toBe(
        'test-subscription-key',
      );
      expect(headers.get('X-Reference-Id')).toBe('ref-uuid-123');
      expect(headers.get('X-Target-Environment')).toBe('sandbox');
    });

    it('should include X-Callback-Url when EXTERNAL_121_SERVICE_URL is set', () => {
      const headers = mtnApiHelperService.createTransferHeaders({
        referenceId: 'ref-uuid-123',
        subscriptionKey: 'test-subscription-key',
      });

      expect(headers.get('X-Callback-Url')).toBe(
        'http://localhost:3000/api/fsps/mtn/transfer-callback',
      );
    });

    it('should not include X-Callback-Url when EXTERNAL_121_SERVICE_URL is empty', () => {
      (env as any).EXTERNAL_121_SERVICE_URL = '';

      const headers = mtnApiHelperService.createTransferHeaders({
        referenceId: 'ref-uuid-123',
        subscriptionKey: 'test-subscription-key',
      });

      expect(headers.get('X-Callback-Url')).toBeNull();
    });
  });

  describe('createGetTransferStatusHeaders', () => {
    it('should return headers with all required fields', () => {
      const headers = mtnApiHelperService.createGetTransferStatusHeaders({
        subscriptionKey: 'test-subscription-key',
      });

      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Cache-Control')).toBe('no-cache');
      expect(headers.get('Ocp-Apim-Subscription-Key')).toBe(
        'test-subscription-key',
      );
      expect(headers.get('X-Target-Environment')).toBe('sandbox');
    });

    it('should not include X-Reference-Id or X-Callback-Url', () => {
      const headers = mtnApiHelperService.createGetTransferStatusHeaders({
        subscriptionKey: 'test-subscription-key',
      });

      expect(headers.get('X-Reference-Id')).toBeNull();
      expect(headers.get('X-Callback-Url')).toBeNull();
    });
  });

  describe('formatResponseError', () => {
    it('should format error with code and message when MTN error shape is present', () => {
      const result = mtnApiHelperService.formatResponseError({
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: {
            code: 'INTERNAL_PROCESSING_ERROR',
            message: 'Internal error.',
          },
        },
      });

      expect(result).toBe(
        'Status: 500, StatusText: Internal Server Error, Code: INTERNAL_PROCESSING_ERROR, Message: Internal error.',
      );
    });

    it('should format error with code and message for bad request', () => {
      const result = mtnApiHelperService.formatResponseError({
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: {
            code: 'INVALID_CALLBACK_URL_HOST',
            message: 'Invalid callback URL',
          },
        },
      });

      expect(result).toBe(
        'Status: 400, StatusText: Bad Request, Code: INVALID_CALLBACK_URL_HOST, Message: Invalid callback URL',
      );
    });

    it('should fall back to JSON.stringify for non-MTN error shapes', () => {
      const result = mtnApiHelperService.formatResponseError({
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { unexpected: 'shape' },
        },
      });

      expect(result).toBe(
        'Status: 500, StatusText: Internal Server Error, Body: {"unexpected":"shape"}',
      );
    });

    it('should handle null response', () => {
      const result = mtnApiHelperService.formatResponseError({
        response: null,
      });

      expect(result).toBe('Status: unknown, StatusText: unknown');
    });

    it('should handle undefined response', () => {
      const result = mtnApiHelperService.formatResponseError({
        response: undefined,
      });

      expect(result).toBe('Status: unknown, StatusText: unknown');
    });

    it('should handle response with no data', () => {
      const result = mtnApiHelperService.formatResponseError({
        response: { status: 404, statusText: 'Not Found' },
      });

      expect(result).toBe('Status: 404, StatusText: Not Found');
    });
  });

  describe('isAuthenticationResponse', () => {
    it('should return true for a valid authentication response', () => {
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          access_token: 'mock-token',
          token_type: 'access_token',
          expires_in: 3600,
        }),
      ).toBe(true);
    });

    it('should return true when only required fields are present', () => {
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          access_token: 'mock-token',
          expires_in: 3600,
        }),
      ).toBe(true);
    });

    it('should return false when access_token is missing', () => {
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          expires_in: 3600,
        }),
      ).toBe(false);
    });

    it('should return false when expires_in is missing', () => {
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          access_token: 'mock-token',
        }),
      ).toBe(false);
    });

    it('should return false when access_token is not a string', () => {
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          access_token: 123,
          expires_in: 3600,
        }),
      ).toBe(false);
    });

    it('should return false when expires_in is not a number', () => {
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          access_token: 'mock-token',
          expires_in: '3600',
        }),
      ).toBe(false);
    });

    it('should return false for null', () => {
      expect(mtnApiHelperService.isAuthenticationResponse(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(mtnApiHelperService.isAuthenticationResponse(undefined)).toBe(
        false,
      );
    });

    it('should return false for an empty object', () => {
      expect(mtnApiHelperService.isAuthenticationResponse({})).toBe(false);
    });
  });
});
