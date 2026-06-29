import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { env } from '@121-service/src/env';
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
      // Arrange
      (env as any).MTN_MODE = FspMode.mock;

      // Act
      const result = mtnApiHelperService.getBaseUrl();

      // Assert
      expect(result.toString()).toBe('http://mock-service:3001/api/fsp/mtn/');
    });

    it('should return MTN API URL when MTN_MODE is not mock', () => {
      // Arrange
      (env as any).MTN_MODE = FspMode.external;
      (env as any).MTN_API_URL = 'https://sandbox.momodeveloper.mtn.com';

      // Act
      const result = mtnApiHelperService.getBaseUrl();

      // Assert
      expect(result.toString()).toBe('https://sandbox.momodeveloper.mtn.com/');
    });
  });

  describe('createTransferPayload', () => {
    it('should return a correctly structured transfer payload', () => {
      // Arrange
      const amount = '100';
      const currency = 'EUR';
      const externalId = '42';
      const phoneNumber = '256771234567';
      const message = 'Payment message';

      // Act
      const result = mtnApiHelperService.createTransferPayload({
        amount,
        currency,
        externalId,
        phoneNumber,
        message,
      });

      // Assert
      expect(result).toEqual({
        amount,
        currency,
        externalId,
        payee: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber,
        },
        payerMessage: message,
        payeeNote: message,
      });
    });
  });

  describe('createTransferHeaders', () => {
    it('should return headers with all required fields', () => {
      // Arrange
      const referenceId = 'ref-uuid-123';
      const subscriptionKey = 'test-subscription-key';

      // Act
      const headers = mtnApiHelperService.createTransferHeaders({
        referenceId,
        subscriptionKey,
      });

      // Assert
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Cache-Control')).toBe('no-cache');
      expect(headers.get('Ocp-Apim-Subscription-Key')).toBe(subscriptionKey);
      expect(headers.get('X-Reference-Id')).toBe(referenceId);
      expect(headers.get('X-Target-Environment')).toBe('sandbox');
    });
  });

  describe('createGetTransferHeaders', () => {
    it('should return headers with all required fields', () => {
      // Arrange
      const subscriptionKey = 'test-subscription-key';

      // Act
      const headers = mtnApiHelperService.createGetTransferHeaders({
        subscriptionKey,
      });

      // Assert
      expect(headers.get('Content-Type')).toBe('application/json');
      expect(headers.get('Cache-Control')).toBe('no-cache');
      expect(headers.get('Ocp-Apim-Subscription-Key')).toBe(subscriptionKey);
      expect(headers.get('X-Target-Environment')).toBe('sandbox');
    });
  });

  describe('formatResponseError', () => {
    it('should include body when response data is present', () => {
      // Act
      const result = mtnApiHelperService.formatResponseError({
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusText: 'Internal Server Error',
          data: {
            code: 'INTERNAL_PROCESSING_ERROR',
            message: 'Internal error.',
          },
        },
      });

      // Assert
      expect(result).toBe(
        'Status: 500, StatusText: Internal Server Error, Body: {"code":"INTERNAL_PROCESSING_ERROR","message":"Internal error."}',
      );
    });

    it('should include body for any data shape', () => {
      // Act
      const result = mtnApiHelperService.formatResponseError({
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusText: 'Internal Server Error',
          data: { unexpected: 'shape' },
        },
      });

      // Assert
      expect(result).toBe(
        'Status: 500, StatusText: Internal Server Error, Body: {"unexpected":"shape"}',
      );
    });

    it('should handle null response', () => {
      // Act
      const result = mtnApiHelperService.formatResponseError({
        response: null,
      });

      // Assert
      expect(result).toBe('Status: unknown, StatusText: unknown');
    });

    it('should handle undefined response', () => {
      // Act
      const result = mtnApiHelperService.formatResponseError({
        response: undefined,
      });

      // Assert
      expect(result).toBe('Status: unknown, StatusText: unknown');
    });

    it('should handle response with no data', () => {
      // Act
      const result = mtnApiHelperService.formatResponseError({
        response: { status: HttpStatus.NOT_FOUND, statusText: 'Not Found' },
      });

      // Assert
      expect(result).toBe('Status: 404, StatusText: Not Found');
    });
  });

  describe('isAuthenticationResponse', () => {
    it('should return true for a valid authentication response', () => {
      // Act & Assert
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          access_token: 'mock-token',
          token_type: 'access_token',
          expires_in: 3600,
        }),
      ).toBe(true);
    });

    it('should return true when only required fields are present', () => {
      // Act & Assert
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          access_token: 'mock-token',
          expires_in: 3600,
        }),
      ).toBe(true);
    });

    it('should return false when access_token is missing', () => {
      // Act & Assert
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          expires_in: 3600,
        }),
      ).toBe(false);
    });

    it('should return false when expires_in is missing', () => {
      // Act & Assert
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          access_token: 'mock-token',
        }),
      ).toBe(false);
    });

    it('should return false when access_token is not a string', () => {
      // Act & Assert
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          access_token: 123,
          expires_in: 3600,
        }),
      ).toBe(false);
    });

    it('should return false when expires_in is not a number', () => {
      // Act & Assert
      expect(
        mtnApiHelperService.isAuthenticationResponse({
          access_token: 'mock-token',
          expires_in: '3600',
        }),
      ).toBe(false);
    });

    it('should return false for null', () => {
      // Act & Assert
      expect(mtnApiHelperService.isAuthenticationResponse(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      // Act & Assert
      expect(mtnApiHelperService.isAuthenticationResponse(undefined)).toBe(
        false,
      );
    });

    it('should return false for an empty object', () => {
      // Act & Assert
      expect(mtnApiHelperService.isAuthenticationResponse({})).toBe(false);
    });
  });
});
