import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import * as https from 'https';
import { v4 as uuid } from 'uuid';

import { ErrorReponseNedbankDto } from '@121-service/src/payments/fsp-integration/nedbank/dtos/nedbank-api/error-reponse-nedbank.dto';
import { NedbankError } from '@121-service/src/payments/fsp-integration/nedbank/errors/nedbank.error';
import {
  CustomHttpService,
  Header,
} from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class NedbankApiHelperService {
  public httpsAgent: https.Agent | undefined;

  public constructor(private readonly httpService: CustomHttpService) {
    this.httpsAgent = this.createHttpsAgent();
  }

  public async makeApiRequestOrThrow<T>({
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
        'Nedbank certificate has not been read. It could be that NEDBANK_CERTIFICATE_PATH or NEDBANK_CERTIFICATE_PASSWORD are not set or that the certificate has not been uploaded to the server. Please contact 121 support',
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
      throw new NedbankError(`Error: ${error.message}`);
    }
    if (this.isNedbankErrorResponse(response.data)) {
      const errorMessage = this.createErrorMessageIfApplicable(response.data);
      throw new NedbankError(errorMessage, response.data.Code);
    }
    return response;
  }

  private createHttpsAgent(): https.Agent | undefined {
    if (this.httpsAgent) {
      return this.httpsAgent;
    }
    // We only check here if the NEDBANK_CERTIFICATE_PATH is set and if the NEDBANK_CERTIFICATE_PASSWORD is set
    // Locally we use .pfx file which is password protected
    // On azure we use .pf12 file which is not password protected
    if (!process.env.NEDBANK_CERTIFICATE_PATH) {
      return;
    }
    return this.httpService.createHttpsAgentWithCertificate(
      process.env.NEDBANK_CERTIFICATE_PATH!,
      process.env.NEDBANK_CERTIFICATE_PASSWORD!,
    );
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
      { name: 'x-fapi-customer-ip-address', value: '0.0.0.0' }, // Should be a valid ip address, it does not seem to matter which one. For now we use a 0.0.0.0 to save us the trouble of setting an env for every server
      { name: 'x-fapi-interaction-id', value: uuid() }, // Should be a UUID https://apim.nedbank.co.za/static/docs/cashout-create-order
      { name: 'Content-Type', value: 'application/json' },
    ];
  }

  private isNedbankErrorResponse(
    response: unknown | ErrorReponseNedbankDto,
  ): response is ErrorReponseNedbankDto {
    return (response as ErrorReponseNedbankDto).Errors !== undefined;
  }

  private createErrorMessageIfApplicable(
    responseBody: ErrorReponseNedbankDto | null,
  ): string {
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
      additionalInfo.push(`Message: ${responseBody.Message}`);
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
}
