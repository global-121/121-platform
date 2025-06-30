import { Test, TestingModule } from '@nestjs/testing';

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

  describe('subscribeWebhook', () => {
    it('should call post twice and return the second response on success', async () => {
      const firstResponse = {
        status: 200,
        statusText: 'OK',
        data: { message: 'Success' },
      };
      const secondResponse = {
        status: 200,
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
        status: 400,
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
