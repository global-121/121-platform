import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import https from 'node:https';
import { v4 as uuid } from 'uuid';

import { env } from '@121-service/src/env';
import { NedbankApiError } from '@121-service/src/fsp-integrations/integrations/nedbank/errors/nedbank-api.error';
import { NedbankApiHelperService } from '@121-service/src/fsp-integrations/integrations/nedbank/services/nedbank-api.helper.service';
import {
  CustomHttpService,
  Header,
} from '@121-service/src/shared/services/custom-http.service';

const nedbankApiUrl = env.MOCK_NEDBANK
  ? `${env.MOCK_SERVICE_URL}/api/fsp/nedbank`
  : env.NEDBANK_API_URL;

@Injectable()
export class NedbankApiClientService {
  private httpsAgent: https.Agent | undefined;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly nedbankApiHelperService: NedbankApiHelperService,
  ) {
    this.httpsAgent = this.createHttpsAgent();
  }

  public async makeApiRequestOrThrow<T>({
    endpoint,
    method,
    payload,
  }: {
    endpoint: string;
    method: 'POST' | 'GET';
    payload?: unknown;
  }): Promise<AxiosResponse<T>> {
    if (!this.httpsAgent) {
      throw new NedbankApiError(
        'Nedbank certificate has not been read. It could be that NEDBANK_CERTIFICATE_PATH or NEDBANK_CERTIFICATE_PASSWORD are not set or that the certificate has not been uploaded to the server. Please contact 121 support',
      );
    }
    const headers = this.createHeaders();

    let response: AxiosResponse<T>;
    try {
      response = await this.httpService.request<AxiosResponse<T>>({
        method,
        url: `${nedbankApiUrl}/${endpoint}`,
        payload,
        headers,
        httpsAgent: this.httpsAgent,
      });
    } catch (error) {
      throw new NedbankApiError(`Error: ${error.message}`);
    }
    if (!response.data) {
      throw new Error('No response received from nedbank');
    }
    if (this.nedbankApiHelperService.isNedbankErrorResponse(response.data)) {
      const errorMessage =
        this.nedbankApiHelperService.createErrorMessageIfApplicable(
          response.data,
        );
      throw new NedbankApiError(errorMessage, response.data.Code);
    }
    return response;
  }

  private createHttpsAgent(): https.Agent | undefined {
    if (this.httpsAgent) {
      return this.httpsAgent;
    }
    // We only check here if the NEDBANK_CERTIFICATE_PATH is set and not if the NEDBANK_CERTIFICATE_PASSWORD is set, because:
    // Locally we use .pfx file which is password protected
    // On azure we use .pf12 file which is not password protected
    if (!env.NEDBANK_CERTIFICATE_PATH) {
      return;
    }
    return this.httpService.createHttpsAgentWithCertificate(
      env.NEDBANK_CERTIFICATE_PATH,
      env.NEDBANK_CERTIFICATE_PASSWORD,
    );
  }

  private createHeaders(): Header[] {
    return [
      { name: 'x-ibm-client-id', value: env.NEDBANK_CLIENT_ID },
      {
        name: 'x-ibm-client-secret',
        value: env.NEDBANK_CLIENT_SECRET,
      },
      {
        name: 'x-idempotency-key', // We use OrderCreateReference as 'idempotency' key and therefore set this thing with a random value
        value: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(),
      },
      {
        name: 'x-jws-signature',
        value: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(), // Should be a random integer https://apim.nedbank.co.za/static/docs/cashout-create-order
      },
      { name: 'x-fapi-financial-id', value: 'OB/2017/001' }, // Should always be this value https://apim.nedbank.co.za/static/docs/cashout-create-order
      { name: 'x-fapi-customer-ip-address', value: '0.0.0.0' }, // Should be a valid ip address, it does not seem to matter which one. For now we use a 0.0.0.0 to save us the trouble of setting an env for every server
      { name: 'x-fapi-interaction-id', value: uuid() }, // Should be a UUID https://apim.nedbank.co.za/static/docs/cashout-create-order
      { name: 'Content-Type', value: 'application/json' },
    ];
  }
}
