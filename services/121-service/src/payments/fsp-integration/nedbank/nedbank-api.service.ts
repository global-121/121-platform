import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import * as https from 'https';
import { v4 as uuid } from 'uuid';

import { NedbankCreateOrderRequestBodyDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/create-order-request-body-nedbank.dto';
import { CreateOrderResponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/create-order-response-nedbank.dto';
import { ErrorReponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/error-reponse-nedbank.dto';
import { GetOrderResponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/get-order-reponse-nedbank.dto';
import { NedbankVoucherStatus } from '@121-service/src/payments/fsp-integration/nedbank/enums/nedbank-voucher-status.enum';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import {
  CustomHttpService,
  Header,
} from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class NedbankApiService {
  public httpsAgent: https.Agent | undefined;

  public constructor(private readonly httpService: CustomHttpService) {
    this.httpsAgent = this.createHttpsAgent();
  }

  public async createOrder({
    transferAmount,
    phoneNumber,
    orderCreateReference,
  }: {
    transferAmount: number;
    phoneNumber: string;
    orderCreateReference: string;
  }): Promise<NedbankVoucherStatus> {
    const payload = this.createOrderPayload({
      transferAmount,
      phoneNumber,
      orderCreateReference,
    });

    const createOrderResponse = await this.makeCreateOrderCall(payload);

    return createOrderResponse.data.Data.Status;
  }

  private createOrderPayload({
    transferAmount,
    phoneNumber,
    orderCreateReference,
  }: {
    transferAmount: number;
    phoneNumber: string;
    orderCreateReference: string;
  }): NedbankCreateOrderRequestBodyDto {
    const currentDate = new Date();
    const expirationDateIsoString = new Date(
      currentDate.setDate(new Date().getDate() + 7),
    ).toISOString();

    return {
      Data: {
        Initiation: {
          InstructionIdentification: uuid().replace(/-/g, ''), // This should be a unique string without dashes or you get an error from nedbank
          InstructedAmount: {
            Amount: `${transferAmount.toString()}.00`, // This should be a string with two decimal places
            Currency: 'ZAR',
          },
          DebtorAccount: {
            SchemeName: 'account', // should always be 'account'
            Identification: process.env.NEDBANK_ACCOUNT_NUMBER!, // ##TODO should we check somewhere if the .env is set?
            Name: 'MyRefOnceOffQATrx', // ##TODO Not sure what to set here. Quote from the API word document from didirik: 'This is what shows on the SARCS statement. We can set this value for (manual) reconciliation purposes.'
          },
          CreditorAccount: {
            SchemeName: 'recipient',
            Identification: phoneNumber,
            Name: 'MyRefOnceOffQATrx', // Name cannot be left empty so set it to a default value found on nedbank api documentation
          },
        },
        ExpirationDateTime: expirationDateIsoString,
      },
      Risk: {
        OrderCreateReference: orderCreateReference,
        OrderDateTime: new Date().toISOString().split('T')[0], // This needs to be set to yyyy-mm-dd
      },
    };
  }

  private async makeCreateOrderCall(
    payload: NedbankCreateOrderRequestBodyDto,
  ): Promise<AxiosResponse<CreateOrderResponseNedbankDto>> {
    const createOrderUrl = !!process.env.MOCK_NEDBANK
      ? `${process.env.MOCK_SERVICE_URL}api/fsp/nedbank/v1/orders`
      : `${process.env.NEDBANK_API_URL}/v1/orders`;

    return this.nedbankApiRequestOrThrow<CreateOrderResponseNedbankDto>({
      url: createOrderUrl,
      method: 'POST',
      payload,
    });
  }

  public async getOrderByOrderCreateReference(
    orderCreateReference: string,
  ): Promise<NedbankVoucherStatus> {
    const getOrderUrl = !!process.env.MOCK_NEDBANK
      ? `${process.env.MOCK_SERVICE_URL}api/fsp/nedbank/v1/orders/references/${orderCreateReference}`
      : `${process.env.NEDBANK_API_URL}/v1/orders/references/${orderCreateReference}`;

    const response =
      await this.nedbankApiRequestOrThrow<GetOrderResponseNedbankDto>({
        url: getOrderUrl,
        method: 'GET',
      });
    return response.data.Data.Transactions.Voucher.Status;
  }

  private async nedbankApiRequestOrThrow<T>({
    url,
    method,
    payload,
  }: {
    url: string;
    method: 'POST' | 'GET';
    payload?: unknown;
  }): Promise<AxiosResponse<T>> {
    if (!this.httpsAgent) {
      throw new NedbankError(
        'Nedbank certificate has not been read. It could be that NEDBANK_CERTIFICATE_PATH or NEDBANK_CERTIFICATE_PASSWORD are not set or that certificate has not been uploaded to the server. Please contact 121 support',
      );
    }
    const headers = this.createHeaders();

    let response: AxiosResponse<T>;
    try {
      response = await this.httpService.request<AxiosResponse<T>>({
        method,
        url,
        payload,
        headers,
        httpsAgent: this.httpsAgent,
      });
    } catch (error) {
      console.log('🚀 ~ NedbankApiService ~ error:', error);
      console.error(`Failed to make Nedbank ${method} call`, error);
      throw new NedbankError(`Error: ${error.message}`);
    }
    console.log('🚀 ~ NedbankApiService ~ response):', response);
    console.log('🚀 ~ NedbankApiService ~ response.data):', response.data);
    console.log('🚀 ~ NedbankApiService ~ response.status):', response.status);
    if (this.isNedbankErrorResponse(response.data)) {
      const errorMessage = this.formatError(response.data);
      throw new NedbankError(errorMessage);
    }
    return response;
  }

  private createHeaders(): Header[] {
    return [
      { name: 'x-ibm-client-id', value: process.env.NEDBANK_CLIENT_ID! },
      {
        name: 'x-ibm-client-secret',
        value: process.env.NEDBANK_CLIENT_SECRET!,
      },
      {
        name: 'x-idempotency-key', // We use OrderCreateReference as 'idempotency' key and therefore set this thing with a random value
        value: Math.floor(Math.random() * 10000).toString(),
      },
      {
        name: 'x-jws-signature',
        value: Math.floor(Math.random() * 10000).toString(), // Should be a random integer https://apim.nedbank.co.za/static/docs/cashout-create-order
      },
      { name: 'x-fapi-financial-id', value: 'OB/2017/001' }, // Should always be this value https://apim.nedbank.co.za/static/docs/cashout-create-order
      { name: 'x-fapi-customer-ip-address', value: '' },
      { name: 'x-fapi-interaction-id', value: uuid() }, // Should be a UUID https://apim.nedbank.co.za/static/docs/cashout-create-order
      { name: 'Content-Type', value: 'application/json' },
    ];
  }

  private isNedbankErrorResponse(
    response: unknown | ErrorReponseNedbankDto,
  ): response is ErrorReponseNedbankDto {
    return (response as ErrorReponseNedbankDto).Errors !== undefined;
  }

  private formatError(responseBody: ErrorReponseNedbankDto | null): string {
    if (!responseBody) {
      return 'Nebank URL could not be reached';
    }
    let errorMessage = '';

    if (responseBody.Errors && responseBody.Errors.length > 0) {
      const errorMessages = responseBody.Errors.map(
        (error) => error.Message,
      ).filter(Boolean);
      errorMessage = `Errors: ${errorMessages.join('; ')}`;
    }

    const additionalInfo: string[] = [];
    if (responseBody.Message) {
      additionalInfo.push(`Message: ${responseBody.Code}`);
    }

    if (responseBody.Code) {
      additionalInfo.push(`Code: ${responseBody.Code}`);
    }
    if (responseBody.Id) {
      additionalInfo.push(`Id: ${responseBody.Id}`);
    }

    if (additionalInfo.length > 0) {
      errorMessage += ` (${additionalInfo.join(', ')})`;
    }

    if (errorMessage === '') {
      errorMessage = 'Unknown error';
    }

    return errorMessage;
  }

  private createHttpsAgent(): https.Agent | undefined {
    if (this.httpsAgent) {
      return this.httpsAgent;
    }
    if (
      !process.env.NEDBANK_CERTIFICATE_PATH ||
      !process.env.NEDBANK_CERTIFICATE_PASSWORD
    ) {
      return;
    }
    return this.httpService.createHttpsAgentWithCertificate(
      process.env.NEDBANK_CERTIFICATE_PATH!,
      process.env.NEDBANK_CERTIFICATE_PASSWORD!,
    );
  }
}
