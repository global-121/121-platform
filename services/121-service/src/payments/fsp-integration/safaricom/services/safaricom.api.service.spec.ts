import { Test, TestingModule } from '@nestjs/testing';
import { TokenSet } from 'openid-client';

import { AuthResponseSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/auth-response-safaricom-api.dto';
import { TransferResponseSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-response-safaricom-api.dto';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/services/safaricom.api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

const transferInput = {
  transferAmount: 10,
  phoneNumber: 'mocked-phone-number',
  idNumber: 'mocked-id-number',
  originatorConversationId: 'mocked-originator-conversation-id',
};

const mockPostTransferResponse: TransferResponseSafaricomApiDto = {
  data: {
    ConversationID: 'mocked-conversation-id',
    OriginatorConversationID: 'mocked-originator-conversation-id',
    ResponseCode: '0',
    ResponseDescription: 'Success',
  },
};

describe('SafaricomApiService', () => {
  let safaricomApiService: SafaricomApiService;
  let customHttpService: CustomHttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafaricomApiService,
        TokenValidationService,
        {
          provide: CustomHttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    safaricomApiService = module.get<SafaricomApiService>(SafaricomApiService);
    customHttpService = module.get<CustomHttpService>(CustomHttpService);

    (customHttpService.post as jest.Mock).mockResolvedValue(
      mockPostTransferResponse,
    );
  });

  describe('transfer', () => {
    it('should succeed without authenticating if tokenSet still valid', async () => {
      // Arrange (mock)
      safaricomApiService.tokenSet = new TokenSet({
        access_token: 'mocked-access-token',
        expires_at: Date.now() + 10 * 60 * 1000, // 10 minute from now
      });

      // Act
      const transferResult = await safaricomApiService.transfer(transferInput);

      // Assert
      expect(transferResult).toBeDefined();
      expect(customHttpService.get).not.toHaveBeenCalled();
      expect(customHttpService.post).toHaveBeenCalled();
    });

    it('should fail if authentication fails', async () => {
      // Arrange (mock)
      const mockGetAuthenticationResponse = { data: null };
      // Can this be moved to central place, instead of repeated in each test?
      (customHttpService.get as jest.Mock).mockResolvedValue(
        mockGetAuthenticationResponse,
      );

      // Act & Assert
      await expect(
        safaricomApiService.transfer(transferInput),
      ).rejects.toThrow();
      expect(customHttpService.get).toHaveBeenCalled();
      expect(customHttpService.post).not.toHaveBeenCalled();
    });

    // ##TODO: Add 1 more test for case where POST fails? And what does POST fail exactly mean? Some error code? Or some response that will trigger a code error later.

    it('should return success response if all API-calls succeed', async () => {
      // Arrange (mock)
      const mockGetAuthenticationResponse: AuthResponseSafaricomApiDto = {
        data: {
          access_token: 'mocked-access-token',
          expires_in: 3599,
        },
      };
      (customHttpService.get as jest.Mock).mockResolvedValue(
        mockGetAuthenticationResponse,
      );

      // Act
      const transferResult = await safaricomApiService.transfer(transferInput);

      // Assert
      expect(transferResult).toBeDefined();
      expect(transferResult.mpesaConversationId).toEqual(
        mockPostTransferResponse.data.ConversationID,
      );
    });
  });
});
