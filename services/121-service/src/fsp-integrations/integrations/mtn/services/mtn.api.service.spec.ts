import { Test, TestingModule } from '@nestjs/testing';

import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnApiDuplicateError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api-duplicate.error';
import { MtnApiHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.helper.service';
import { MtnApiService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const baseUrl = new URL('https://sandbox.momodeveloper.mtn.com/');
const transferHeaders = new Headers({ 'X-Reference-Id': 'ref-uuid' });
const statusHeaders = new Headers({ 'Ocp-Apim-Subscription-Key': 'key' });

const createTransferInput = {
  referenceId: '550e8400-e29b-41d4-a716-446655440000',
  amount: '100',
  currency: 'EUR',
  externalId: '42',
  payee: { partyIdType: 'MSISDN', partyId: '256771234567' },
  payerMessage: 'Payment',
  payeeNote: 'Note',
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
            createGetTransferStatusHeaders: jest
              .fn()
              .mockReturnValue(statusHeaders),
          },
        },
      ],
    }).compile();

    mtnApiService = module.get<MtnApiService>(MtnApiService);
    const customHttpService = module.get<CustomHttpService>(CustomHttpService);
    post = customHttpService.post as jest.Mock;
    get = customHttpService.get as jest.Mock;
  });

  describe('createTransfer', () => {
    it('should call POST with the correct URL, payload and headers', async () => {
      // Arrange
      post.mockResolvedValue({ status: 202 });

      // Act
      await mtnApiService.createTransfer(createTransferInput);

      // Assert
      expect(post).toHaveBeenCalledWith(
        'https://sandbox.momodeveloper.mtn.com/disbursement/v1_0/transfer',
        transferPayload,
        transferHeaders,
      );
    });

    it('should throw MtnApiDuplicateError when the API responds with 409', async () => {
      // Arrange
      post.mockResolvedValue({ status: 409, statusText: 'Conflict' });

      // Act & Assert
      await expect(
        mtnApiService.createTransfer(createTransferInput),
      ).rejects.toBeInstanceOf(MtnApiDuplicateError);
    });

    it('should throw MtnApiError when the API responds with a non-2xx status', async () => {
      // Arrange
      post.mockResolvedValue({
        status: 500,
        statusText: 'Internal Server Error',
      });

      // Act & Assert
      await expect(
        mtnApiService.createTransfer(createTransferInput),
      ).rejects.toBeInstanceOf(MtnApiError);
    });

    it('should throw MtnApiError when the HTTP call rejects', async () => {
      // Arrange
      post.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(
        mtnApiService.createTransfer(createTransferInput),
      ).rejects.toBeInstanceOf(MtnApiError);
    });

    it('should rethrow MtnApiDuplicateError without wrapping when it propagates from a dependency', async () => {
      // Arrange
      post.mockRejectedValue(
        new MtnApiDuplicateError('Duplicate transfer request'),
      );

      // Act
      let error: unknown;
      try {
        await mtnApiService.createTransfer(createTransferInput);
      } catch (e) {
        error = e;
      }

      // Assert
      expect(error).toBeInstanceOf(MtnApiDuplicateError);
    });
  });

  describe('getTransferStatus', () => {
    it('should call GET with the correct URL and headers', async () => {
      // Arrange
      get.mockResolvedValue({ status: 200, data: { status: 'SUCCESSFUL' } });

      // Act
      await mtnApiService.getTransferStatus({ referenceId: 'ref-uuid' });
      // For now we need can use sandbox URL in assertion as the base URL is determined by the helper service which is mocked to return sandbox URL.
      // If we want to make it more flexible we would need to also mock the helper service's getBaseUrl method to return a test-specific URL that can be asserted against here.
      // Assert
      expect(get).toHaveBeenCalledWith(
        'https://sandbox.momodeveloper.mtn.com/disbursement/v1_0/transfer/ref-uuid',
        statusHeaders,
      );
    });

    it('should return the transfer status from the response', async () => {
      // Arrange
      get.mockResolvedValue({ status: 200, data: { status: 'SUCCESSFUL' } });

      // Act
      const result = await mtnApiService.getTransferStatus({
        referenceId: 'ref-uuid',
      });

      // Assert
      expect(result).toEqual({ status: 'SUCCESSFUL' });
    });

    it('should throw MtnApiError when the API responds with a non-2xx status', async () => {
      // Arrange
      get.mockResolvedValue({ status: 404, statusText: 'Not Found', data: {} });

      // Act & Assert
      await expect(
        mtnApiService.getTransferStatus({ referenceId: 'ref-uuid' }),
      ).rejects.toBeInstanceOf(MtnApiError);
    });

    it('should throw MtnApiError when the HTTP call rejects', async () => {
      // Arrange
      get.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(
        mtnApiService.getTransferStatus({ referenceId: 'ref-uuid' }),
      ).rejects.toBeInstanceOf(MtnApiError);
    });
  });
});
