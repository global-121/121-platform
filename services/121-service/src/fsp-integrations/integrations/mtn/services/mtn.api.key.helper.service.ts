import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { v4 as createUuid } from 'uuid';

import { env } from '@121-service/src/env';
import { MtnApiCreateApiKeyResponse } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/create-api-key-response-mtn-api.dto';
import { MtnApiCreateApiUserRequestBody } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/create-api-user-request-body-mtn-api.dto';
import { MtnApiCreateTokenResponse } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/create-token-response-mtn-api.dto';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class MtnApiKeyHelperService {
  public constructor(private readonly httpService: CustomHttpService) {}

  public async getAccessToken(): Promise<{
    accessToken: string;
    referenceId: string;
    apiKey: string;
  }> {
    const referenceId = await this.createApiUser();
    const apiKey = await this.createApiKey({ referenceId });
    const accessToken = await this.createAccessToken({
      referenceId,
      apiKey,
    });
    return { accessToken, referenceId, apiKey };
  }

  public async getBaseUrl(): Promise<URL> {
    if (env.MTN_MODE === FspMode.mock) {
      return new URL('api/fsp/mtn/', env.MOCK_SERVICE_URL);
    }
    if (!env.MTN_API_URL) {
      throw new MtnApiError('MTN_API_URL is not set');
    }
    return new URL(env.MTN_API_URL);
  }

  public async getSubscriptionKeyOrThrow(): Promise<string> {
    if (!env.MTN_SUBSCRIPTION_KEY) {
      throw new MtnApiError('MTN_SUBSCRIPTION_KEY is not set');
    }
    return env.MTN_SUBSCRIPTION_KEY;
  }

  private async createApiUser(): Promise<string> {
    const referenceId = createUuid();
    const url = new URL('v1_0/apiuser', await this.getBaseUrl());

    const headers = new Headers();
    headers.set('X-Reference-Id', referenceId);
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'no-cache');
    headers.set(
      'Ocp-Apim-Subscription-Key',
      await this.getSubscriptionKeyOrThrow(),
    );

    const payload: MtnApiCreateApiUserRequestBody = {
      providerCallbackHost: env.MTN_PROVIDER_CALLBACK_HOST ?? '',
    };

    const response = await this.httpService.post<AxiosResponse<void>>(
      url.toString(),
      payload,
      headers,
    );

    if (!response || response.status < 201 || response.status >= 300) {
      throw new MtnApiError(
        `Failed to create API user. Status: ${response?.status ?? 'unknown'}, StatusText: ${response?.statusText ?? 'unknown'}`,
      );
    }

    return referenceId;
  }

  private async createApiKey({
    referenceId,
  }: {
    referenceId: string;
  }): Promise<string> {
    const url = new URL(
      `v1_0/apiuser/${referenceId}/apikey`,
      await this.getBaseUrl(),
    );

    const headers = new Headers();
    headers.set('Cache-Control', 'no-cache');
    headers.set(
      'Ocp-Apim-Subscription-Key',
      await this.getSubscriptionKeyOrThrow(),
    );

    const response = await this.httpService.post<
      AxiosResponse<MtnApiCreateApiKeyResponse>
    >(url.toString(), {}, headers);

    if (!response?.data?.apiKey) {
      throw new MtnApiError(
        `Failed to create API key. Status: ${response?.status ?? 'unknown'}, StatusText: ${response?.statusText ?? 'unknown'}`,
      );
    }

    return response.data.apiKey;
  }

  private async createAccessToken({
    referenceId,
    apiKey,
  }: {
    referenceId: string;
    apiKey: string;
  }): Promise<string> {
    const url = new URL('disbursement/token/', await this.getBaseUrl());

    const basicAuth = Buffer.from(`${referenceId}:${apiKey}`).toString(
      'base64',
    );

    const headers = new Headers();
    headers.set('Authorization', `Basic ${basicAuth}`);
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'no-cache');
    headers.set(
      'Ocp-Apim-Subscription-Key',
      await this.getSubscriptionKeyOrThrow(),
    );

    const response = await this.httpService.post<
      AxiosResponse<MtnApiCreateTokenResponse>
    >(url.toString(), {}, headers);

    if (!response?.data?.access_token) {
      throw new MtnApiError(
        `Failed to create access token. Status: ${response?.status ?? 'unknown'}, StatusText: ${response?.statusText ?? 'unknown'}`,
      );
    }

    return response.data.access_token;
  }
}
