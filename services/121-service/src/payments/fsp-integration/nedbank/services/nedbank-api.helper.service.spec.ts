import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { Test, TestingModule } from '@nestjs/testing';
import * as https from 'https';

import { CreateOrderResponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/create-order-response-nedbank.dto';
import { ErrorReponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/error-reponse-nedbank.dto';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankApiHelperService } from '@121-service/src/payments/fsp-integration/nedbank/services/nedbank-api.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

jest.mock('@121-service/src/shared/services/custom-http.service');

describe('NedbankApiHelperService', () => {
  let service: NedbankApiHelperService;
  let httpService: CustomHttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NedbankApiHelperService,
        {
          provide: CustomHttpService,
          useValue: {
            request: jest.fn(),
            createHttpsAgentWithCertificate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NedbankApiHelperService>(NedbankApiHelperService);
    httpService = module.get<CustomHttpService>(CustomHttpService);

    // Mock the https.Agent
    const mockHttpsAgent = {} as https.Agent;

    // Set the mock https.Agent in the service
    service.httpsAgent = mockHttpsAgent;
  });

  describe('makeApiRequestOrThrow', () => {
    it('should succesfully make an request', async () => {
      // Arrange
      const payload = { test: 'test' };
      const url = 'https://example.com';
      const response: AxiosResponse<CreateOrderResponseNedbankDto> = {
        data: {
          Data: {
            OrderId: '',
            Status: NedbankVoucherStatus.PENDING,
          },
          Links: {
            Self: '',
          },
          Meta: {},
        },
        status: 201,
        statusText: 'OK',
        headers: {},
        config: {},
      };
      const method = 'POST';

      jest.spyOn(httpService, 'request').mockResolvedValue(response);

      // Act
      const result = await service.makeApiRequestOrThrow({
        url,
        method,
        payload,
      });

      // Assert
      expect(result).toEqual(response);
      const requestCallArgs = (httpService.request as jest.Mock).mock.calls[0];
      const requestCallParamObject = requestCallArgs[0];

      // ##TODO: Discuss asserting the requestCallParamObject is the best approach should we use a more 'black box' approach and only assert the return value?
      // Is the typescript static typing enough to ensure that the correct headers, payload and method are set?
      expect(requestCallParamObject.payload).toMatchObject(payload);

      // Check the headers
      expect(requestCallParamObject.headers).toEqual([
        { name: 'x-ibm-client-id', value: process.env.NEDBANK_CLIENT_ID },
        {
          name: 'x-ibm-client-secret',
          value: process.env.NEDBANK_CLIENT_SECRET,
        },
        { name: 'x-idempotency-key', value: expect.any(String) },
        { name: 'x-jws-signature', value: expect.any(String) },
        { name: 'x-fapi-financial-id', value: 'OB/2017/001' },
        {
          name: 'x-fapi-customer-ip-address',
          value: expect.stringMatching(
            /^(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}|[0-9a-fA-F:]+)$/,
          ),
        },
        {
          name: 'x-fapi-interaction-id',
          value: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
          ),
        },
        { name: 'Content-Type', value: 'application/json' },
      ]);
      expect(requestCallParamObject.method).toBe(method);
    });

    it('should throw an error if httpsAgent is not defined', async () => {
      service.httpsAgent = undefined;
      await expect(
        service.makeApiRequestOrThrow({
          url: 'https://example.com',
          method: 'GET',
        }),
      ).rejects.toThrow(NedbankError);
    });

    describe('throw an error and format the error message', () => {
      it('should handle multiple Nedbank errors', async () => {
        const errorResponse: AxiosResponse<ErrorReponseNedbankDto> = {
          data: {
            Message: 'BUSINESS ERROR',
            Code: 'NB.APIM.Field.Invalid',
            Id: '1d3e3076-9e1c-4933-aa7f-69290941ec70',
            Errors: [
              {
                ErrorCode: 'NB.APIM.Field.Invalid',
                Message:
                  'Request Validation Error - TPP account configuration mismatch',
                Path: '',
                Url: '',
              },
              {
                ErrorCode: 'NB.APIM.Field.Invalid',
                Message: 'Another error message',
                Path: '',
                Url: '',
              },
            ],
          },
          status: 201,
          statusText: '',
          headers: {},
          config: {},
        };

        jest.spyOn(httpService, 'request').mockResolvedValue(errorResponse);

        let errorOnCreateOrder: NedbankError | any; // The any is unfortunately needed to prevent type errors;
        try {
          await service.makeApiRequestOrThrow({
            url: 'url',
            method: 'POST',
            payload: {},
          });
        } catch (error) {
          errorOnCreateOrder = error;
        }
        const errorMessage1 = errorResponse.data.Errors[0].Message;
        expect(errorOnCreateOrder.message).toContain(errorMessage1);
        const errorMessage2 = errorResponse.data.Errors[1].Message;
        expect(errorOnCreateOrder.message).toContain(errorMessage2);
        expect(errorOnCreateOrder.message).toContain(
          `Message: ${errorResponse.data.Message}`,
        );
        expect(errorOnCreateOrder.message).toContain(
          `Code: ${errorResponse.data.Code}`,
        );
        expect(errorOnCreateOrder.message).toContain(
          `Id: ${errorResponse.data.Id}`,
        );
      });

      it('should handle a single Nedbank error', async () => {
        const errorResponse: AxiosResponse<ErrorReponseNedbankDto> = {
          data: {
            Message: 'BUSINESS ERROR',
            Code: 'NB.APIM.Field.Invalid',
            Id: '1d3e3076-9e1c-4933-aa7f-69290941ec70',
            Errors: [
              {
                ErrorCode: 'NB.APIM.Field.Invalid',
                Message:
                  'Request Validation Error - TPP account configuration mismatch',
                Path: '',
                Url: '',
              },
            ],
          },
          status: 201,
          statusText: '',
          headers: {},
          config: {},
        };

        jest.spyOn(httpService, 'request').mockResolvedValue(errorResponse);

        let errorOnCreateOrder: NedbankError | any; // The any is unfortunately needed to prevent type errors;
        try {
          await service.makeApiRequestOrThrow({
            url: 'url',
            method: 'POST',
            payload: {},
          });
        } catch (error) {
          errorOnCreateOrder = error;
        }
        const errorMessage = errorResponse.data.Errors[0].Message;
        expect(errorOnCreateOrder.message).toContain(errorMessage);
        expect(errorOnCreateOrder.message).toContain(
          `Message: ${errorResponse.data.Message}`,
        );
        expect(errorOnCreateOrder.message).toContain(
          `Code: ${errorResponse.data.Code}`,
        );
        expect(errorOnCreateOrder.message).toContain(
          `Id: ${errorResponse.data.Id}`,
        );
      });

      it('should handle an empty error array from Nedbank', async () => {
        const errorResponse: AxiosResponse<ErrorReponseNedbankDto> = {
          data: {
            Message: 'BUSINESS ERROR',
            Code: 'NB.APIM.Field.Invalid',
            Id: '1d3e3076-9e1c-4933-aa7f-69290941ec70',
            Errors: [],
          },
          status: 201,
          statusText: '',
          headers: {},
          config: {},
        };

        jest.spyOn(httpService, 'request').mockResolvedValue(errorResponse);

        let errorOnCreateOrder: NedbankError | any; // The any is unfortunately needed to prevent type errors;
        try {
          await service.makeApiRequestOrThrow({
            url: 'url',
            method: 'POST',
            payload: {},
          });
        } catch (error) {
          errorOnCreateOrder = error;
        }

        expect(errorOnCreateOrder.message).toContain(
          `Message: ${errorResponse.data.Message}`,
        );
        expect(errorOnCreateOrder.message).toContain(
          `Code: ${errorResponse.data.Code}`,
        );
        expect(errorOnCreateOrder.message).toContain(
          `Id: ${errorResponse.data.Id}`,
        );
      });

      it('should handle an error without message', async () => {
        const errorResponse: AxiosResponse<ErrorReponseNedbankDto> = {
          data: {
            Message: '',
            Code: 'NB.APIM.Field.Invalid',
            Id: '1d3e3076-9e1c-4933-aa7f-69290941ec70',
            Errors: [
              {
                ErrorCode: 'NB.APIM.Field.Invalid',
                Message: '',
                Path: '',
                Url: '',
              },
            ],
          },
          status: 201,
          statusText: '',
          headers: {},
          config: {},
        };

        jest.spyOn(httpService, 'request').mockResolvedValue(errorResponse);

        let errorOnCreateOrder: NedbankError | any; // The any is unfortunately needed to prevent type errors;
        try {
          await service.makeApiRequestOrThrow({
            url: 'url',
            method: 'POST',
            payload: {},
          });
        } catch (error) {
          errorOnCreateOrder = error;
        }
        expect(errorOnCreateOrder).toBeInstanceOf(NedbankError);
        expect(errorOnCreateOrder.message).not.toContain(
          `Message: ${errorResponse.data.Message}`,
        );
        expect(errorOnCreateOrder.message).toContain(
          `Code: ${errorResponse.data.Code}`,
        );
        expect(errorOnCreateOrder.message).toContain(
          `Id: ${errorResponse.data.Id}`,
        );
      });
    });
  });
});
