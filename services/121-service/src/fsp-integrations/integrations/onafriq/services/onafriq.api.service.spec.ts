import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OnafriqApiResponseStatusType } from '@121-service/src/fsp-integrations/integrations/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/fsp-integrations/integrations/onafriq/errors/onafriq.error';
import { OnafriqApiHelperService } from '@121-service/src/fsp-integrations/integrations/onafriq/services/onafriq.api.helper.service';
import { OnafriqApiService } from '@121-service/src/fsp-integrations/integrations/onafriq/services/onafriq.api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const mockParams = {
  transferValue: 100,
  phoneNumberPayment: '123456789',
  firstName: 'John',
  lastName: 'Doe',
  thirdPartyTransId: 'abc123',
  requestIdentity: {
    corporateCode: 'mocked_corporate_code',
    password: 'mocked_password',
    uniqueKey: 'mocked_unique_key',
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
        {
          provide: CustomHttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    onafriqApiService = module.get<OnafriqApiService>(OnafriqApiService);
    customHttpService = module.get<CustomHttpService>(CustomHttpService);
  });

  describe('callService', () => {
    it('should return generic error when OnafriqcallService returns invalid response', async () => {
      const invalidResponse = undefined;
      (customHttpService.post as jest.Mock).mockResolvedValue(invalidResponse);

      let error: unknown;
      try {
        await onafriqApiService.callService(mockParams);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(OnafriqError);
      expect((error as OnafriqError).message).toMatchSnapshot();
    });

    it('should return success status on success response', async () => {
      const validResponse = {
        status: HttpStatus.OK,
        data: {
          totalTxSent: 1,
          noTxAccepted: 1,
          noTxRejected: 0,
          details: {
            transResponse: [
              {
                thirdPartyId: 'abc123',
                status: {
                  code: '100',
                  message: 'Accepted',
                },
              },
            ],
          },
          timestamp: new Date().toISOString(),
        },
      };
      (customHttpService.post as jest.Mock).mockResolvedValue(validResponse);

      const result = await onafriqApiService.callService(mockParams);

      expect(result.status).toBe(OnafriqApiResponseStatusType.success);
    });
  });
});
