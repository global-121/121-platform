import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { MtnTransferErrorTypes } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-error-types.enum';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnRequestIdentity } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-request-identity.interface';
import { MtnApiHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.helper.service';
import { MtnApiService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('@121-service/src/env', () => ({
  env: {},
}));

const baseUrl = new URL('https://sandbox.momodeveloper.mtn.com/');
const tokenUrl = new URL(
  'https://sandbox.momodeveloper.mtn.com/disbursement/token/',
);
const transferHeaders = new Headers({ 'X-Reference-Id': 'ref-uuid' });
const statusHeaders = new Headers({ 'Ocp-Apim-Subscription-Key': 'key' });
const commonHeaders = new Headers({ 'Ocp-Apim-Subscription-Key': 'key' });

const mockAuthResponse = {
  status: HttpStatus.OK,
  data: {
    access_token: 'mock-access-token',
    token_type: 'access_token',
    expires_in: 3600,
  },
};

const testRequestIdentity: MtnRequestIdentity = {
  subscriptionKey: 'test-subscription-key',
  referenceId: 'test-reference-id',
  apiKey: 'test-api-key',
};

const createTransferInput = {
  mtnReferenceId: '550e8400-e29b-41d4-a716-446655440000',
  amount: '100',
  currency: 'EUR',
  externalId: '42',
  phoneNumber: '256771234567',
  message: 'Payment',
  requestIdentity: testRequestIdentity,
};

const transferPayload = {
  amount: '100',
  currency: 'EUR',
  externalId: '42',
  payee: { partyIdType: 'MSISDN', partyId: '256771234567' },
  payerMessage: 'Payment',
  payeeNote: 'Note',
};

describe('MtnApiService', () => {
  let mtnApiService: MtnApiService;
  let mtnApiHelperService: MtnApiHelperService;
  let post: jest.Mock;
  let get: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MtnApiService,
        {
          provide: CustomHttpService,
          useValue: { post: jest.fn(), get: jest.fn() },
        },
        {
          provide: MtnApiHelperService,
          useValue: {
            getBaseUrl: jest.fn().mockReturnValue(baseUrl),
            createTransferPayload: jest.fn().mockReturnValue(transferPayload),
            createTransferHeaders: jest.fn().mockReturnValue(transferHeaders),
            createGetTransferHeaders: jest.fn().mockReturnValue(statusHeaders),
            createCommonHeaders: jest.fn().mockReturnValue(commonHeaders),
            formatResponseError: jest.fn(),
            isAuthenticationResponse: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    mtnApiService = module.get<MtnApiService>(MtnApiService);
    mtnApiHelperService = module.get<MtnApiHelperService>(MtnApiHelperService);
    const customHttpService = module.get<CustomHttpService>(CustomHttpService);
    post = customHttpService.post as jest.Mock;
    get = customHttpService.get as jest.Mock;
  });

  describe('createTransfer', () => {
    it('should call POST with the correct URL, payload and headers', async () => {
      // Arrange
      post
        .mockResolvedValueOnce(mockAuthResponse) // authenticate() call
        .mockResolvedValueOnce({ status: HttpStatus.ACCEPTED }); // createTransfer() call

      // Act
      await mtnApiService.createTransfer(createTransferInput);

      // Assert
      expect(post).toHaveBeenCalledTimes(2);
      expect(post).toHaveBeenNthCalledWith(
        1,
        tokenUrl.href,
        {},
        expect.any(Headers),
      );
      expect(post).toHaveBeenNthCalledWith(
        2,
        'https://sandbox.momodeveloper.mtn.com/disbursement/v1_0/transfer',
        transferPayload,
        expect.any(Headers),
      );
    });

    it('should throw MtnApiError with duplicate type when the API responds with 409', async () => {
      // Arrange
      post
        .mockResolvedValueOnce(mockAuthResponse) // authenticate() call
        .mockResolvedValueOnce({ status: HttpStatus.CONFLICT, statusText: 'Conflict' }); // createTransfer() call

      // Act & Assert
      await expect(
        mtnApiService.createTransfer(createTransferInput),
      ).rejects.toMatchObject({
        type: MtnTransferErrorTypes.duplicate,
      });
    });

    it('should throw MtnApiError when the API responds with a non-2xx status', async () => {
      // Arrange
      post
        .mockResolvedValueOnce(mockAuthResponse) // authenticate() call
        .mockResolvedValueOnce({
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          statusText: 'Internal Server Error',
        }); // createTransfer() call

      // Act & Assert
      await expect(
        mtnApiService.createTransfer(createTransferInput),
      ).rejects.toBeInstanceOf(MtnApiError);
    });

    it('should throw MtnApiError when the HTTP call rejects', async () => {
      // Arrange
      post
        .mockResolvedValueOnce(mockAuthResponse) // authenticate() call
        .mockRejectedValueOnce(new Error('Network error')); // createTransfer() call

      // Act & Assert
      await expect(
        mtnApiService.createTransfer(createTransferInput),
      ).rejects.toBeInstanceOf(MtnApiError);
    });

    it('should rethrow MtnApiError with duplicate type without wrapping when it propagates from a dependency', async () => {
      // Arrange
      post
        .mockResolvedValueOnce(mockAuthResponse) // authenticate() call
        .mockRejectedValueOnce(
          new MtnApiError({
            type: MtnTransferErrorTypes.duplicate,
            message: 'Duplicate transfer request',
          }),
        ); // createTransfer() call

      // Act
      let error: unknown;
      try {
        await mtnApiService.createTransfer(createTransferInput);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(MtnApiError);
      expect((error as MtnApiError).type).toBe(MtnTransferErrorTypes.duplicate);
    });
  });

  describe('getTransfer', () => {
    it('should call GET with the correct URL and headers', async () => {
      // Arrange
      post.mockResolvedValueOnce(mockAuthResponse); // authenticate() call
      get.mockResolvedValueOnce({
        status: HttpStatus.OK,
        data: { status: 'SUCCESSFUL' },
      });

      // Act
      await mtnApiService.getTransfer({
        referenceId: 'ref-uuid',
        requestIdentity: testRequestIdentity,
      });
      // For now we need can use sandbox URL in assertion as the base URL is determined by the helper service which is mocked to return sandbox URL.
      // If we want to make it more flexible we would need to also mock the helper service's getBaseUrl method to return a test-specific URL that can be asserted against here.
      // Assert
      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith(tokenUrl.href, {}, expect.any(Headers));
      expect(get).toHaveBeenCalledWith(
        'https://sandbox.momodeveloper.mtn.com/disbursement/v1_0/transfer/ref-uuid',
        expect.any(Headers),
      );
    });

    it('should return the transfer status from the response', async () => {
      // Arrange
      post.mockResolvedValueOnce(mockAuthResponse); // authenticate() call
      get.mockResolvedValueOnce({
        status: HttpStatus.OK,
        data: { status: 'SUCCESSFUL' },
      });

      // Act
      const result = await mtnApiService.getTransfer({
        referenceId: 'ref-uuid',
        requestIdentity: testRequestIdentity,
      });

      // Assert
      expect(result).toEqual({ status: 'SUCCESSFUL' });
    });

    it('should throw MtnApiError when the API responds with a non-2xx status', async () => {
      // Arrange
      post.mockResolvedValueOnce(mockAuthResponse); // authenticate() call
      get.mockResolvedValueOnce({
        status: HttpStatus.NOT_FOUND,
        statusText: 'Not Found',
        data: {},
      });

      // Act & Assert
      await expect(
        mtnApiService.getTransfer({
          referenceId: 'ref-uuid',
          requestIdentity: testRequestIdentity,
        }),
      ).rejects.toBeInstanceOf(MtnApiError);
    });

    it('should throw MtnApiError when the HTTP call rejects', async () => {
      // Arrange
      post.mockResolvedValueOnce(mockAuthResponse); // authenticate() call
      get.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(
        mtnApiService.getTransfer({
          referenceId: 'ref-uuid',
          requestIdentity: testRequestIdentity,
        }),
      ).rejects.toBeInstanceOf(MtnApiError);
    });
  });

  describe('authenticate', () => {
    it('should throw MtnApiError when authentication fails', async () => {
      // Arrange
      post.mockRejectedValueOnce(new Error('Auth network error'));

      // Act & Assert
      await expect(
        mtnApiService.createTransfer(createTransferInput),
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('authentication failed'),
        }),
      );
    });

    it('should throw MtnApiError when authentication response is unexpected', async () => {
      // Arrange
      post.mockResolvedValueOnce({ status: HttpStatus.OK, data: {} });
      (
        mtnApiHelperService.isAuthenticationResponse as unknown as jest.Mock
      ).mockReturnValue(false);

      // Act & Assert
      await expect(
        mtnApiService.createTransfer(createTransferInput),
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('unexpected response from MTN API'),
        }),
      );
    });
  });
});
