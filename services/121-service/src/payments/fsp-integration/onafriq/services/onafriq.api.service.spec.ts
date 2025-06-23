import { Test, TestingModule } from '@nestjs/testing';

import { OnafriqApiCallServiceResponseBody } from '@121-service/src/payments/fsp-integration/onafriq/dtos/onafriq-api/onafriq-api-call-service-response-body.dto';
import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { CreateTransactionParams } from '@121-service/src/payments/fsp-integration/onafriq/interfaces/create-transaction-params.interface';
import { OnafriqApiHelperService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.helper.service';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

const mockedThirdPartyTransId = 'mocked_third_party_trans_id';
const mockedCreateTransactionParams: CreateTransactionParams = {
  transferAmount: 100,
  phoneNumber: '254708374149',
  thirdPartyTransId: mockedThirdPartyTransId,
  firstName: 'mocked_first_name',
  lastName: 'mocked_last_name',
};

const mockPostCallServiceResponse: OnafriqApiCallServiceResponseBody = {
  data: {
    totalTxSent: 1,
    noTxAccepted: 1,
    noTxRejected: 0,
    details: {
      transResponse: [
        {
          thirdPartyId: mockedThirdPartyTransId,
          status: {
            code: '100',
            message: 'Accepted',
          },
        },
      ],
    },
    timestamp: '2019-12-18 07:50:26.771',
  },
};

describe('OnafriqApiService', () => {
  let onafriqApiService: OnafriqApiService;
  let customHttpService: CustomHttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnafriqApiService,
        OnafriqApiHelperService,
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

    onafriqApiService = module.get<OnafriqApiService>(OnafriqApiService);
    customHttpService = module.get<CustomHttpService>(CustomHttpService);

    (customHttpService.post as jest.Mock).mockResolvedValue(
      mockPostCallServiceResponse,
    );
  });

  describe('callService', () => {
    it('should succeed', async () => {
      // Arrange

      // Act
      const callServiceResult = await onafriqApiService.callService(
        mockedCreateTransactionParams,
      );

      // Assert
      expect(customHttpService.post).toHaveBeenCalled();
      expect(callServiceResult).toBeDefined();
      expect(callServiceResult.status).toEqual(
        OnafriqApiResponseStatusType.success,
      );
    });
  });

  describe('subscribeWebhook', () => {
    it('should call httpService.post and return the response if not in mock mode', async () => {
      process.env.MOCK_ONAFRIQ = '';
      const expectedResponse = {
        status: 200,
        statusText: 'OK',
        data: {
          message: 1,
          data: {
            corporateCode: 'corp',
            callbackUrl: 'url',
          },
        },
      };
      (customHttpService.post as jest.Mock).mockResolvedValue(expectedResponse);
      const result = await onafriqApiService.subscribeWebhook();
      expect(customHttpService.post).toHaveBeenCalled();
      expect(result).toEqual(expectedResponse);
    });
  });
});
