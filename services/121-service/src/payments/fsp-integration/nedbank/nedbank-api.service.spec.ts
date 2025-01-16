import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { Test, TestingModule } from '@nestjs/testing';
import * as https from 'https';

import { CreateOrderResponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/create-order-response-nedbank.dto';
import { ErrorReponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/error-reponse-nedbank.dto';
import { GetOrderResponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/get-order-reponse-nedbank.dto';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankApiService } from '@121-service/src/payments/fsp-integration/nedbank/nedbank-api.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';
import { registrationNedbank } from '@121-service/test/registrations/pagination/pagination-data';

const amount = 250;
const orderCreateReference = '123456'; // This is a uuid generated deterministically, so we can use a fixed value

jest.mock('@121-service/src/shared/services/custom-http.service');

describe('NedbankApiService', () => {
  let service: NedbankApiService;
  let httpService: CustomHttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NedbankApiService, CustomHttpService],
    }).compile();

    service = module.get<NedbankApiService>(NedbankApiService);
    service.httpsAgent = {} as https.Agent;
    httpService = module.get<CustomHttpService>(CustomHttpService);
  });

  describe('createOrder', () => {
    it('should create an order successfully', async () => {
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

      jest.spyOn(httpService, 'request').mockResolvedValue(response);

      const result = await service.createOrder({
        transferAmount: amount,
        phoneNumber: registrationNedbank.phoneNumber,
        orderCreateReference,
      });
      expect(result).toEqual(response.data.Data.Status);

      const requestCallArgs = (httpService.request as jest.Mock).mock.calls[0];
      const requestCallParamObject = requestCallArgs[0];

      // Check the URL
      expect(requestCallParamObject.url).toContain('v1/orders'); // ##TODO Should we check this here or just check if it is at least a string of len > 0?

      // Check the payload
      expect(requestCallParamObject.payload).toMatchObject({
        // ##TODO: this code contains some hardcoded strings, like ('recipient'), which are also hardcode in the actual service. Should we extract them to constants or just check if they are present?
        Data: {
          Initiation: {
            CreditorAccount: {
              Identification: registrationNedbank.phoneNumber,
              Name: 'MyRefOnceOffQATrx',
              SchemeName: 'recipient',
            },
            DebtorAccount: {
              Identification: process.env.NEDBANK_ACCOUNT_NUMBER,
              Name: 'MyRefOnceOffQATrx',
              SchemeName: 'account',
            },
            InstructedAmount: {
              Amount: `${amount.toString()}.00`,
              Currency: 'ZAR',
            },
            InstructionIdentification: expect.any(String), // This is generated dynamically
          },
          ExpirationDateTime: expect.any(String), // This is generated dynamically
        },
        Risk: {
          OrderCreateReference: orderCreateReference,
          OrderDateTime: expect.any(String), // This is generated dynamically
        },
      });

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
        { name: 'x-fapi-customer-ip-address', value: process.env.PUBLIC_IP },
        { name: 'x-fapi-interaction-id', value: expect.any(String) },
        { name: 'Content-Type', value: 'application/json' },
      ]);

      expect(requestCallParamObject.method).toBe('POST');
    });

    it('should throw an error if create order fails', async () => {
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
        status: 201, // Nedbank returns 201 even on errors
        statusText: '',
        headers: {},
        config: {},
      };

      jest.spyOn(httpService, 'request').mockResolvedValue(errorResponse);

      await expect(
        service.createOrder({
          transferAmount: amount,
          phoneNumber: registrationNedbank.phoneNumber,
          orderCreateReference,
        }),
      ).rejects.toThrow(NedbankError);

      // TODO: Not sure if this is the best/prettiest syntax to test the content of the error but it works
      let errorOnCreateOrder: NedbankError | undefined;
      try {
        await service.createOrder({
          transferAmount: amount,
          phoneNumber: registrationNedbank.phoneNumber,
          orderCreateReference,
        });
      } catch (error) {
        errorOnCreateOrder = error;
      }
      expect(errorOnCreateOrder).toMatchSnapshot();
    });

    it('should throw an error if httpsAgent is not defined', async () => {
      service.httpsAgent = undefined;

      // TODO: Not sure if this is the best/prettiest syntax to test the content of the error but it works
      let errorOnCreateOrder: NedbankError | undefined;
      try {
        await service.createOrder({
          transferAmount: amount,
          phoneNumber: registrationNedbank.phoneNumber,
          orderCreateReference,
        });
      } catch (error) {
        errorOnCreateOrder = error;
      }
      expect(errorOnCreateOrder).toMatchSnapshot();
    });
  });

  describe('getOrder', () => {
    it('should get an order successfully', async () => {
      const response: AxiosResponse<GetOrderResponseNedbankDto> = {
        data: {
          Data: {
            OrderId: '',
            Transactions: {
              Voucher: {
                Code: '',
                Status: NedbankVoucherStatus.REDEEMED,
                Redeem: {
                  Redeemable: true,
                  Redeemed: false,
                  RedeemedOn: '',
                  RedeemedAt: '',
                },
                Refund: {
                  Refundable: true,
                  Refunded: false,
                  RefundedOn: '',
                },
                Pin: '',
              },
              PaymentReferenceNumber: '',
              OrderCreateReference: orderCreateReference,
              OrderDateTime: '',
              OrderExpiry: '',
            },
          },
          Links: {
            Self: '',
          },
          Meta: {},
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      };
      jest.spyOn(httpService, 'request').mockResolvedValue(response);

      const result =
        await service.getOrderByOrderCreateReference(orderCreateReference);
      expect(result).toEqual(response.data.Data.Transactions.Voucher.Status);

      const requestCallArgs = (httpService.request as jest.Mock).mock.calls[0];

      // Check the URL
      expect(requestCallArgs[0].url).toContain(`orders/references/`);

      // Check the method
      expect(requestCallArgs[0].method).toBe('GET');

      //  Do not check the header details as this is already done in the createOrder test
      expect(requestCallArgs[0].headers).toEqual(expect.any(Object));
    });

    it('should throw an error if get order fails', async () => {
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
        statusText: 'Bad Request',
        headers: {},
        config: {},
      };

      jest.spyOn(httpService, 'request').mockResolvedValue(errorResponse);

      await expect(
        service.getOrderByOrderCreateReference('orderCreateReference'),
      ).rejects.toThrow(NedbankError);

      // Check the error message
      let errorOnGetOrder: NedbankError | undefined;
      try {
        await service.getOrderByOrderCreateReference('orderCreateReference');
      } catch (error) {
        errorOnGetOrder = error;
      }
      expect(errorOnGetOrder).toMatchSnapshot();
    });
  });
});
