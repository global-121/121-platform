import { Test, TestingModule } from '@nestjs/testing';

import { CooperativeBankOfOromiaApiTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-request-body.dto';
import { CooperativeBankOfOromiaApiTransferResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/dtos/cooperative-bank-of-oromia-api-transfer-response-body.dto';
import { CooperativeBankOfOromiaTransferResultEnum } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/enums/cooperative-bank-of-oromia-disbursement-result.enum';
import { CooperativeBankOfOromiaApiHelperService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.helper.service';
import { CooperativeBankOfOromiaApiService } from '@121-service/src/fsp-integrations/integrations/cooperative-bank-of-oromia/services/cooperative-bank-of-oromia.api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

const transferInput = {
  cooperativeBankOfOromiaMessageId: 'msg-123',
  recipientCreditAccountNumber: '1234567890',
  debitAccountNumber: '0987654321',
  amount: 100,
};

describe('CooperativeBankOfOromiaApiService', () => {
  let service: CooperativeBankOfOromiaApiService;
  let customHttpService: CustomHttpService;
  let apiHelperService: CooperativeBankOfOromiaApiHelperService;
  let post: jest.Mock;

  beforeEach(async () => {
    const isTokenValidMock = jest
      .fn()
      // First call: token is invalid (force authentication)
      .mockReturnValueOnce(false)
      // Subsequent calls: token is valid (use cached token)
      .mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CooperativeBankOfOromiaApiService,
        {
          provide: CustomHttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
        {
          provide: TokenValidationService,
          useValue: {
            isTokenValid: isTokenValidMock,
          },
        },
        {
          provide: CooperativeBankOfOromiaApiHelperService,
          useValue: {
            buildTransferPayload: jest.fn(
              () => ({}) as CooperativeBankOfOromiaApiTransferRequestBodyDto,
            ),
            handleTransferResponse: jest.fn((_data) => ({
              result: CooperativeBankOfOromiaTransferResultEnum.success,
            })),
          },
        },
      ],
    }).compile();

    service = module.get<CooperativeBankOfOromiaApiService>(
      CooperativeBankOfOromiaApiService,
    );
    customHttpService = module.get<CustomHttpService>(CustomHttpService);
    apiHelperService = module.get<CooperativeBankOfOromiaApiHelperService>(
      CooperativeBankOfOromiaApiHelperService,
    );
    post = customHttpService.post as jest.Mock;
  });

  describe('authentication flow', () => {
    it('should call post transfer if authenticate is successful', async () => {
      // Mock httpService.post to return a token on first call and transfer response on second call
      const mockAuthResponse = {
        data: { access_token: 'mock-access-token', expires_in: 10000 },
      };
      const mockTransferResponse = { data: { success: true } } as {
        data: CooperativeBankOfOromiaApiTransferResponseBodyDto;
      };
      post.mockImplementationOnce(() => Promise.resolve(mockAuthResponse));
      post.mockImplementationOnce(() => Promise.resolve(mockTransferResponse));

      // Mock handleTransferResponse to return success
      (apiHelperService.handleTransferResponse as jest.Mock).mockReturnValue({
        result: CooperativeBankOfOromiaTransferResultEnum.success,
      });

      const result = await service.initiateTransfer(transferInput);
      expect(result).toEqual({
        result: CooperativeBankOfOromiaTransferResultEnum.success,
      });

      expect(post).toHaveBeenCalledTimes(2);
      // Check that the second call is the transfer initiation with expected arguments
      const transferUrl = service['getTransferUrl']().href;
      expect(post).toHaveBeenNthCalledWith(
        2,
        transferUrl,
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should fail if authenticate returns error response', async () => {
      const mockAuthErrorResponse = {
        data: {
          error_description:
            'Error decoding authorization header. Last unit does not have enough valid bits',
          error: 'invalid_client',
        },
      };
      post.mockImplementationOnce(() => Promise.resolve(mockAuthErrorResponse));

      const result = await service.initiateTransfer(transferInput);
      expect(result.result).toBe(
        CooperativeBankOfOromiaTransferResultEnum.fail,
      );
      expect(result.message).toMatchSnapshot();
      // Never attempt to post transfer if authentication fails
      expect(post).toHaveBeenCalledTimes(1);
    });

    it('should use cached token for subsequent transfers', async () => {
      // Mock httpService.post to return a token on first call and transfer response on subsequent calls
      const mockAuthResponse = {
        data: { access_token: 'mock-access-token', expires_in: 10000 },
      };
      const mockTransferResponse = { data: { success: true } } as {
        data: CooperativeBankOfOromiaApiTransferResponseBodyDto;
      };

      // First call: authentication, then transfer
      post.mockImplementationOnce(() => Promise.resolve(mockAuthResponse));
      post.mockImplementationOnce(() => Promise.resolve(mockTransferResponse));

      // Mock handleTransferResponse to return success
      (apiHelperService.handleTransferResponse as jest.Mock).mockReturnValue({
        result: CooperativeBankOfOromiaTransferResultEnum.success,
      });

      // First transfer (should trigger authentication and transfer)
      const result1 = await service.initiateTransfer(transferInput);
      expect(result1).toEqual({
        result: CooperativeBankOfOromiaTransferResultEnum.success,
      });

      // Second call: only transfer, no authentication
      post.mockImplementationOnce(() => Promise.resolve(mockTransferResponse));
      const result2 = await service.initiateTransfer(transferInput);
      expect(result2).toEqual({
        result: CooperativeBankOfOromiaTransferResultEnum.success,
      });

      // First call: auth + transfer, second call: only transfer
      expect(post).toHaveBeenCalledTimes(3);
      // The first call is for auth, the second and third are for transfer
      expect(post.mock.calls[0][0]).toContain('oauth2/token');
      expect(post.mock.calls[1][0]).toContain('nrc/1.0.0/transfer');
      expect(post.mock.calls[2][0]).toContain('nrc/1.0.0/transfer');
    });
  });

  describe('HTTP error handling', () => {
    beforeEach(() => {
      // Mock successful authentication for these tests
      const mockAuthResponse = {
        data: { access_token: 'mock-access-token', expires_in: 10000 },
      };
      post.mockImplementationOnce(() => Promise.resolve(mockAuthResponse));
    });

    it('should handle 503 Service Unavailable error with clear message', async () => {
      const mockError = new Error('Request failed with status code 503');
      (mockError as any).response = { status: 503 };
      post.mockImplementationOnce(() => Promise.reject(mockError));

      const result = await service.initiateTransfer(transferInput);

      expect(result.result).toBe(
        CooperativeBankOfOromiaTransferResultEnum.fail,
      );
      expect(result.message).toBe(
        'Cooperative Bank of Oromia service is temporarily unavailable (HTTP 503). Please try again later.',
      );
    });

    it('should handle 502 Bad Gateway error with clear message', async () => {
      const mockError = new Error('Request failed with status code 502');
      (mockError as any).response = { status: 502 };
      post.mockImplementationOnce(() => Promise.reject(mockError));

      const result = await service.initiateTransfer(transferInput);

      expect(result.result).toBe(
        CooperativeBankOfOromiaTransferResultEnum.fail,
      );
      expect(result.message).toBe(
        'Cooperative Bank of Oromia service is temporarily unavailable (HTTP 502). Please try again later.',
      );
    });

    it('should handle 504 Gateway Timeout error with clear message', async () => {
      const mockError = new Error('Request failed with status code 504');
      (mockError as any).response = { status: 504 };
      post.mockImplementationOnce(() => Promise.reject(mockError));

      const result = await service.initiateTransfer(transferInput);

      expect(result.result).toBe(
        CooperativeBankOfOromiaTransferResultEnum.fail,
      );
      expect(result.message).toBe(
        'Cooperative Bank of Oromia service is temporarily unavailable (HTTP 504). Please try again later.',
      );
    });

    it('should handle other HTTP errors with status code', async () => {
      const mockError = new Error('Request failed with status code 400');
      (mockError as any).response = { status: 400 };
      post.mockImplementationOnce(() => Promise.reject(mockError));

      const result = await service.initiateTransfer(transferInput);

      expect(result.result).toBe(
        CooperativeBankOfOromiaTransferResultEnum.fail,
      );
      expect(result.message).toBe(
        'Transfer failed: Request failed with status code 400 (HTTP 400)',
      );
    });

    it('should handle network errors without status code', async () => {
      const mockError = new Error('Network error');
      post.mockImplementationOnce(() => Promise.reject(mockError));

      const result = await service.initiateTransfer(transferInput);

      expect(result.result).toBe(
        CooperativeBankOfOromiaTransferResultEnum.fail,
      );
      expect(result.message).toBe('Transfer failed: Network error');
    });
  });
});
