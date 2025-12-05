import { Test, TestingModule } from '@nestjs/testing';

import { AuthResponseSafaricomApiDto } from '@121-service/src/fsp-integrations/integrations/safaricom/dtos/safaricom-api/auth-response-safaricom-api.dto';
import { TransferResponseSafaricomApiDto } from '@121-service/src/fsp-integrations/integrations/safaricom/dtos/safaricom-api/transfer-response-safaricom-api.dto';
import { SafaricomApiHelperService } from '@121-service/src/fsp-integrations/integrations/safaricom/services/safaricom.api.helper.service';
import { SafaricomApiService } from '@121-service/src/fsp-integrations/integrations/safaricom/services/safaricom.api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

const transferInput = {
  transferValue: 10,
  phoneNumber: 'mocked-phone-number',
  idNumber: 'mocked-id-number',
  originatorConversationId: 'mocked-originator-conversation-id',
};

const mockGetAuthenticationResponse: AuthResponseSafaricomApiDto = {
  data: {
    access_token: 'mocked-access-token',
    expires_in: 3599,
  },
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
        SafaricomApiHelperService,
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

    (customHttpService.get as jest.Mock).mockResolvedValue(
      mockGetAuthenticationResponse,
    );
    (customHttpService.post as jest.Mock).mockResolvedValue(
      mockPostTransferResponse,
    );
  });

  describe('transfer', () => {
    it('should succeed with authenticating if no tokenSet present', async () => {
      // Arrange (mock)

      // Act
      const transferResult = await safaricomApiService.transfer(transferInput);

      // Assert
      expect(customHttpService.get).toHaveBeenCalled();
      expect(customHttpService.post).toHaveBeenCalled();
      expect(transferResult).toBeDefined();
      expect(transferResult.mpesaConversationId).toEqual(
        mockPostTransferResponse.data.ConversationID,
      );
    });

    it('should succeed without authenticating if tokenSet still valid', async () => {
      // Arrange (mock)
      // Set up this test by already calling the transfer method once, so that the tokenSet is already present/valid the 2nd time, in Act-phase
      await safaricomApiService.transfer(transferInput);

      // Act
      const transferResult = await safaricomApiService.transfer(transferInput);

      // Assert
      expect(customHttpService.get).toHaveBeenCalledTimes(1); // Specifically assert that the get method is not called again on the 2nd transfer call
      expect(customHttpService.post).toHaveBeenCalledTimes(2);
      expect(transferResult).toBeDefined();
    });
  });
});
