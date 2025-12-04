import { HttpStatus } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { Test, TestingModule } from '@nestjs/testing';
import https from 'node:https';

import { CreateOrderResponseNedbankApiDto } from '@121-service/src/fsp-integrations/integrations/nedbank/dtos/nedbank-api/create-order-response-nedbank-api.dto';
import { ErrorReponseNedbankApiDto } from '@121-service/src/fsp-integrations/integrations/nedbank/dtos/nedbank-api/error-response-nedbank-api.dto';
import { NedbankVoucherStatus } from '@121-service/src/fsp-integrations/integrations/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankApiError } from '@121-service/src/fsp-integrations/integrations/nedbank/errors/nedbank-api.error';
import { NedbankApiHelperService } from '@121-service/src/fsp-integrations/integrations/nedbank/services/nedbank-api.helper.service';
import { NedbankApiClientService } from '@121-service/src/fsp-integrations/integrations/nedbank/services/nedbank-api-client.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('@121-service/src/shared/services/custom-http.service');

describe('NedbankApiClientService', () => {
  let service: NedbankApiClientService;
  let apiHelperService: NedbankApiHelperService;
  let httpService: CustomHttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NedbankApiClientService,
        {
          provide: CustomHttpService,
          useValue: {
            request: jest.fn(),
            createHttpsAgentWithCertificate: jest.fn(),
          },
        },
        {
          provide: NedbankApiHelperService,
          useValue: {
            isNedbankErrorResponse: jest.fn(),
            createErrorMessageIfApplicable: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NedbankApiClientService>(NedbankApiClientService);
    httpService = module.get<CustomHttpService>(CustomHttpService);
    apiHelperService = module.get<NedbankApiHelperService>(
      NedbankApiHelperService,
    );
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('makeApiRequestOrThrow', () => {
    it('should successfully make a request', async () => {
      // Arrange
      const payload = { test: 'test' };
      const endpoint = 'endpoint';
      const response: AxiosResponse<CreateOrderResponseNedbankApiDto> = {
        data: {
          Data: {
            OrderId: '',
            Status: NedbankVoucherStatus.PENDING,
          },
          Links: { Self: '' },
          Meta: {},
        },
        status: HttpStatus.CREATED,
        statusText: 'OK',
        headers: {},
        config: {},
      };

      jest.spyOn(httpService, 'request').mockResolvedValue(response);
      jest
        .spyOn(apiHelperService, 'isNedbankErrorResponse')
        .mockReturnValue(false);
      jest
        .spyOn(httpService, 'createHttpsAgentWithCertificate')
        .mockReturnValue({} as https.Agent);

      // Reinitialize the service to set httpsAgent
      service = new NedbankApiClientService(httpService, apiHelperService);

      // Act
      const result = await service.makeApiRequestOrThrow({
        endpoint,
        method: 'POST',
        payload,
      });

      // Assert
      expect(result).toEqual(response);
      expect(httpService.request).toHaveBeenCalledWith(
        expect.objectContaining({ payload, method: 'POST' }),
      );
    });

    it('should throw an error if httpsAgent is not defined', async () => {
      jest
        .spyOn(httpService, 'createHttpsAgentWithCertificate')
        .mockReturnValue(undefined as any);

      // Reinitialize the service to set httpsAgent to undefined
      service = new NedbankApiClientService(httpService, apiHelperService);

      await expect(
        service.makeApiRequestOrThrow({
          endpoint: 'https://example.org',
          method: 'GET',
        }),
      ).rejects.toThrow(NedbankApiError);
    });

    it('should throw an Nedbank API error if an error response body is received from Nedbank API', async () => {
      const errorResponse: AxiosResponse<ErrorReponseNedbankApiDto> = {
        data: {
          Message: 'BUSINESS ERROR',
          Code: 'NB.APIM.Field.Invalid',
          Id: 'error-id',
          Errors: [
            { ErrorCode: 'NB.APIM.Field.Invalid', Message: 'Error message' },
          ],
        },
        status: HttpStatus.BAD_REQUEST,
        statusText: 'Bad Request',
        headers: {},
        config: {},
      };

      jest
        .spyOn(apiHelperService, 'isNedbankErrorResponse')
        .mockReturnValue(true);
      jest.spyOn(httpService, 'request').mockResolvedValue(errorResponse);
      jest
        .spyOn(httpService, 'createHttpsAgentWithCertificate')
        .mockReturnValue({} as https.Agent);

      // Reinitialize the service to set httpsAgent
      service = new NedbankApiClientService(httpService, apiHelperService);

      await expect(
        service.makeApiRequestOrThrow({
          endpoint: 'endpoint',
          method: 'POST',
          payload: {},
        }),
      ).rejects.toThrow(NedbankApiError);
    });
  });
});
