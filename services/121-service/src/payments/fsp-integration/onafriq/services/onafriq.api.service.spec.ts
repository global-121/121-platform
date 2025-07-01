import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { OnafriqApiResponseStatusType } from '@121-service/src/payments/fsp-integration/onafriq/enum/onafriq-api-response-status-type.enum';
import { OnafriqError } from '@121-service/src/payments/fsp-integration/onafriq/errors/onafriq.error';
import { OnafriqApiHelperService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.helper.service';
import { OnafriqApiService } from '@121-service/src/payments/fsp-integration/onafriq/services/onafriq.api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

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

      const params = {
        transferAmount: 100,
        phoneNumber: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        thirdPartyTransId: 'abc123',
      };

      let error: unknown;
      try {
        await onafriqApiService.callService(params);
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

      const params = {
        transferAmount: 100,
        phoneNumber: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        thirdPartyTransId: 'abc123',
      };

      const result = await onafriqApiService.callService(params);

      expect(result.status).toBe(OnafriqApiResponseStatusType.success);
    });
  });

  describe('subscribeWebhook', () => {
    it('should call post twice and return the second response on success', async () => {
      const firstResponse = {
        status: HttpStatus.OK,
        statusText: 'OK',
        data: { message: 'Success' },
      };
      const secondResponse = {
        status: HttpStatus.OK,
        statusText: 'OK',
        data: { message: 'Success' },
      };
      (customHttpService.post as jest.Mock)
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      const result = await onafriqApiService.subscribeWebhook();
      expect(customHttpService.post).toHaveBeenCalledTimes(2);
      expect(result).toEqual(secondResponse);
    });

    it('should return after first post if not 200 or message not Success', async () => {
      const firstResponse = {
        status: HttpStatus.BAD_REQUEST,
        statusText: 'Bad Request',
        data: { message: 'Error' },
      };
      (customHttpService.post as jest.Mock).mockResolvedValueOnce(
        firstResponse,
      );

      const result = await onafriqApiService.subscribeWebhook();
      expect(customHttpService.post).toHaveBeenCalledTimes(1);
      expect(result).toEqual(firstResponse);
    });
  });
});
