import { Test, TestingModule } from '@nestjs/testing';

import { OnafriqApiCallServiceResponseBody } from '@121-service/src/fsp-integrations/integrations/onafriq/dtos/onafriq-api/onafriq-api-call-service-response-body.dto';
import { OnafriqApiCallServiceResponseTransactionStatusCode } from '@121-service/src/fsp-integrations/integrations/onafriq/enum/onafriq-api-call-service-response-transaction-status-code.enum';
import { OnafriqApiResponseStatusType } from '@121-service/src/fsp-integrations/integrations/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqApiHelperService } from '@121-service/src/fsp-integrations/integrations/onafriq/services/onafriq.api.helper.service';

const thirdPartyTransId = 'mocked-third-party-trans-id';
const baseCallServiceResponse: OnafriqApiCallServiceResponseBody = {
  data: {
    totalTxSent: 1,
    noTxAccepted: 1,
    noTxRejected: 0,
    details: {
      transResponse: [
        {
          thirdPartyId: thirdPartyTransId,
          status: {
            code: OnafriqApiCallServiceResponseTransactionStatusCode.accepted,
            message: 'Accepted',
            messageDetail: undefined,
          },
        },
      ],
    },
    timestamp: new Date().toISOString(),
  },
};

describe('OnafriqApiHelperService', () => {
  let onafriqApiHelperService: OnafriqApiHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnafriqApiHelperService],
    }).compile();

    onafriqApiHelperService = module.get<OnafriqApiHelperService>(
      OnafriqApiHelperService,
    );
  });

  describe('processCallServiceResponse', () => {
    it('to return duplicate thirdPartyTransId error status and message if API errorCode indicating duplicate thirdPartyTransId', async () => {
      // Arrange
      const callServiceResponse: OnafriqApiCallServiceResponseBody = {
        data: {
          ...baseCallServiceResponse.data,
          details: {
            transResponse: [
              {
                thirdPartyId: thirdPartyTransId,
                status: {
                  code: OnafriqApiCallServiceResponseTransactionStatusCode.rejected,
                  message: 'Rejected',
                  messageDetail:
                    'Transaction already exist with given ThirdParty',
                },
              },
            ],
          },
        },
      };

      // Act
      const response =
        onafriqApiHelperService.processCallServiceResponse(callServiceResponse);

      // Assert
      expect(response.status).toBe(
        OnafriqApiResponseStatusType.duplicateThirdPartyTransIdError,
      );
      expect(response.errorMessage).toMatchSnapshot();
    });

    it('to return generic error status and right error message if other API errorCode', async () => {
      // Arrange
      const callServiceResponse: OnafriqApiCallServiceResponseBody = {
        data: {
          ...baseCallServiceResponse.data,
          details: {
            transResponse: [
              {
                thirdPartyId: thirdPartyTransId,
                status: {
                  code: OnafriqApiCallServiceResponseTransactionStatusCode.rejected,
                  message: 'Rejected',
                  messageDetail: 'Other error',
                },
              },
            ],
          },
        },
      };

      // Act
      const response =
        onafriqApiHelperService.processCallServiceResponse(callServiceResponse);

      // Assert
      expect(response.status).toBe(OnafriqApiResponseStatusType.genericError);
      expect(response.errorMessage).toMatchSnapshot();
    });

    it('to return success status if API response indicates success', async () => {
      // Arrange
      const callServiceResponse: OnafriqApiCallServiceResponseBody = {
        ...baseCallServiceResponse,
      };

      // Act
      const response =
        onafriqApiHelperService.processCallServiceResponse(callServiceResponse);

      // Assert
      expect(response.status).toBe(OnafriqApiResponseStatusType.success);
      expect(response.errorMessage).not.toBeDefined();
    });
  });
});
