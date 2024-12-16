import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import * as https from 'https';
import { v4 as uuid } from 'uuid';

import { NedbankCreateOrderPayloadDto } from '@121-service/src/payments/fsp-integration/nedbank/dto/nedbank-create-order-payload.dto';
import { NedbankCreateOrderResponseDto } from '@121-service/src/payments/fsp-integration/nedbank/dto/nedbank-create-order-response.dto';
import { NedbankGetOrderResponseDto } from '@121-service/src/payments/fsp-integration/nedbank/dto/nedbank-get-order-reponse.dto';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import { NedbankErrorResponse } from '@121-service/src/payments/fsp-integration/nedbank/interfaces/nedbank-error-reponse';
import { createHttpsAgentWithCertificate } from '@121-service/src/payments/payments.helpers';
import {
  CustomHttpService,
  Header,
} from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class NedbankApiService {
  public httpsAgent: https.Agent;

  public constructor(private readonly httpService: CustomHttpService) {
    this.createHttpsAgent();
  }

  public async createOrder({
    transferAmount,
    fullName,
    idNumber,
    orderCreateReference,
  }): Promise<NedbankCreateOrderResponseDto> {
    const payload = this.createOrderPayload({
      transferAmount,
      fullName,
      idNumber,
      orderCreateReference,
    });

    const createOrderResponse = await this.makeCreateOrderCall(payload);

    return createOrderResponse.data;
  }

  private createOrderPayload({
    transferAmount,
    fullName,
    idNumber,
    orderCreateReference,
  }): NedbankCreateOrderPayloadDto {
    const currentDate = new Date();
    const expirationDate = new Date(
      currentDate.getTime() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    ).toISOString();

    return {
      Data: {
        Initiation: {
          InstructionIdentification: uuid().replace(/-/g, ''), // This should be a string without dashes or you get an error from nedbank
          InstructedAmount: {
            Amount: `${transferAmount.toString()}.00`, // This should be a string with two decimal places
            Currency: 'ZAR',
          },
          DebtorAccount: {
            SchemeName: 'account', // should always be 'account'
            Identification: process.env.NEDBANK_ACCOUNT_NUMBER!, // ##TODO should we check somewhere if the .env is set?
            Name: 'MyRefOnceOffQATrx', // ##TODO Not sure what to set here. Quote from the API word document from didirik: 'This is what shows on the SARCS statement. We can set this value for (manual) reconciliation purposes.'
            SecondaryIdentification: '1', // Leaving this at '1' - This is described in the online documentation but not in the word we have from Nedbank. I assume it is not use like the other SecondaryIdentification.
          },
          CreditorAccount: {
            SchemeName: 'recipient',
            Identification: idNumber,
            Name: fullName,
            SecondaryIdentification: '1', // Leaving this at '1' - Additional identification of recipient, like customer number. But not used anywhere at the moment.
          },
        },
        ExpirationDateTime: expirationDate,
      },
      Risk: {
        OrderCreateReference: orderCreateReference,
        // OrderCreateReference: uuid(),
        OrderDateTime: new Date().toISOString().split('T')[0], // This needs to be set to yyyy-mm-dd
      },
    };
  }

  private async makeCreateOrderCall(
    payload: NedbankCreateOrderPayloadDto,
  ): Promise<AxiosResponse<NedbankCreateOrderResponseDto>> {
    const createOrderUrl = !!process.env.MOCK_NEDBANK
      ? `${process.env.MOCK_SERVICE_URL}api/fsp/nedbank/v1/orders`
      : `${process.env.NEDBANK_API_URL}/v1/orders`;

    return this.nedbankApiRequestOrThrow<NedbankCreateOrderResponseDto>(
      createOrderUrl,
      'POST',
      payload,
    );
  }

  public async getOrder(
    orderCreateReference: string,
  ): Promise<NedbankGetOrderResponseDto> {
    const response = await this.makeGetOrderCall(orderCreateReference);
    return response.data;
  }

  private async makeGetOrderCall(
    orderCreateReference: string,
  ): Promise<AxiosResponse<NedbankGetOrderResponseDto>> {
    const getOrderUrl = !!process.env.MOCK_NEDBANK
      ? `${process.env.MOCK_SERVICE_URL}api/fsp/nedbank/v1/orders/references/${orderCreateReference}`
      : `${process.env.NEDBANK_API_URL}/v1/orders/references/${orderCreateReference}`;

    return this.nedbankApiRequestOrThrow<NedbankGetOrderResponseDto>(
      getOrderUrl,
      'GET',
      null,
    );
  }

  private async nedbankApiRequestOrThrow<T>(
    url: string,
    method: 'POST' | 'GET',
    payload: unknown,
  ): Promise<AxiosResponse<T>> {
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
      console.error(`Failed to make Nedbank ${method} call`, error);
      throw new NedbankError(`Error: ${error.message}`);
    }
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
        name: 'x-idempotency-key', // ##TODO: From the comments in the Nedbank API documenetation word file it's now completely clear what this should be. I assume based on this convo that we use OrderCreateReference as 'idempotency' key and I therefore set this thing randomly
        value: Math.floor(Math.random() * 10000).toString(),
      },
      {
        name: 'x-jws-signature',
        value: Math.floor(Math.random() * 10000).toString(), // Should be a random integer https://apim.nedbank.co.za/static/docs/cashout-create-order
      },
      { name: 'x-fapi-financial-id', value: 'OB/2017/001' }, // Should always be this value https://apim.nedbank.co.za/static/docs/cashout-create-order
      { name: 'x-fapi-customer-ip-address', value: process.env.PUBLIC_IP! },
      { name: 'x-fapi-interaction-id', value: uuid() }, // Should be a UUID https://apim.nedbank.co.za/static/docs/cashout-create-order
      { name: 'Content-Type', value: 'application/json' },
    ];
  }

  private isNedbankErrorResponse(
    response: unknown | NedbankErrorResponse,
  ): response is NedbankErrorResponse {
    return (response as NedbankErrorResponse).Errors !== undefined;
  }

  private formatError(responseBody: NedbankErrorResponse | null): string {
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

  private createHttpsAgent() {
    if (this.httpsAgent) {
      return;
    }
    // ##TODO is there a smart way to throw an error here if the .env is not set but the client does want to use nedbank? Or is that overengineering?
    if (
      !process.env.NEDBANK_CERTIFICATE_PATH ||
      !process.env.NEDBANK_CERTIFICATE_PASSWORD
    ) {
      return;
    }
    this.httpsAgent = createHttpsAgentWithCertificate(
      process.env.NEDBANK_CERTIFICATE_PATH!,
      process.env.NEDBANK_CERTIFICATE_PASSWORD!,
    );
  }
}
