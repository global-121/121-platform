import { HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { TokenSet } from 'openid-client';

import { MtnApiCreateTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-create-transfer-request-body.dto';
import { MtnTransferErrorTypes } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-error-types.enum';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnApiCreateTransferParams } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-api-create-transfer-params.interface';
import { MtnRequestIdentity } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-request-identity.interface';
import { MtnTransferStatusResponse } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-transfer-status-response.interface';
import { MtnApiHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class MtnApiService {
  private readonly tokenCache = new Map<string, TokenSet>();

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly mtnApiHelperService: MtnApiHelperService,
  ) {}

  private getTransferUrl(): URL {
    return new URL(
      'disbursement/v1_0/transfer',
      this.mtnApiHelperService.getBaseUrl(),
    );
  }

  private getTokenURL(): URL {
    return new URL(
      'disbursement/token/',
      this.mtnApiHelperService.getBaseUrl(),
    );
  }

  private addAuthHeaders({
    headers,
    requestIdentity,
  }: {
    headers: Headers;
    requestIdentity: MtnRequestIdentity;
  }): Headers {
    const tokenSet = this.tokenCache.get(requestIdentity.referenceId);
    if (!tokenSet || !tokenSet.access_token) {
      throw new Error('No access token available for MTN API requests');
    }
    headers.set('Authorization', `Bearer ${tokenSet.access_token}`);
    return headers;
  }

  public async createTransfer({
    mtnReferenceId,
    amount,
    currency,
    externalId,
    phoneNumber,
    message,
    requestIdentity,
  }: MtnApiCreateTransferParams): Promise<void> {
    await this.authenticate({ requestIdentity });
    const payload = this.mtnApiHelperService.createTransferPayload({
      amount,
      currency,
      externalId,
      phoneNumber,
      message,
    });
    await this.initiateTransferRequest({
      payload,
      referenceId: mtnReferenceId,
      requestIdentity,
    });
  }

  public async getTransfer({
    referenceId,
    requestIdentity,
  }: {
    referenceId: string;
    requestIdentity: MtnRequestIdentity;
  }): Promise<MtnTransferStatusResponse> {
    await this.authenticate({ requestIdentity });

    const url = new URL(`${this.getTransferUrl()}/${referenceId}`);

    const headers = this.addAuthHeaders({
      headers: this.mtnApiHelperService.createGetTransferHeaders({
        subscriptionKey: requestIdentity.subscriptionKey,
      }),
      requestIdentity,
    });

    let response: AxiosResponse<MtnTransferStatusResponse>;
    try {
      response = await this.httpService.get<
        AxiosResponse<MtnTransferStatusResponse>
      >(url.toString(), headers);
    } catch (error) {
      throw new MtnApiError({
        type: MtnTransferErrorTypes.fail,
        message: `Error getting transfer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    if (!response || response.status < 200 || response.status >= 300) {
      throw new MtnApiError({
        type: MtnTransferErrorTypes.fail,
        message: `Failed to get transfer. ${this.mtnApiHelperService.formatResponseError({ response })}`,
      });
    }

    return response.data;
  }

  private async initiateTransferRequest({
    payload,
    referenceId,
    requestIdentity,
  }: {
    payload: MtnApiCreateTransferRequestBodyDto;
    referenceId: string;
    requestIdentity: MtnRequestIdentity;
  }): Promise<void> {
    const url = this.getTransferUrl();

    const headers = this.addAuthHeaders({
      headers: this.mtnApiHelperService.createTransferHeaders({
        referenceId,
        subscriptionKey: requestIdentity.subscriptionKey,
      }),
      requestIdentity,
    });

    let response: AxiosResponse<void>;
    try {
      response = await this.httpService.post<AxiosResponse<void>>(
        url.toString(),
        payload,
        headers,
      );
    } catch (error) {
      throw new MtnApiError({
        type: MtnTransferErrorTypes.fail,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    if (response?.status === HttpStatus.CONFLICT) {
      throw new MtnApiError({
        type: MtnTransferErrorTypes.duplicate,
        message: `Duplicate transfer request for referenceId: ${referenceId}`,
      });
    }

    if (
      !response ||
      response.status < HttpStatus.ACCEPTED ||
      response.status >= 300
    ) {
      throw new MtnApiError({
        type: MtnTransferErrorTypes.fail,
        message: `Failed to create transfer. ${this.mtnApiHelperService.formatResponseError({ response })}`,
      });
    }
  }

  private async authenticate({
    requestIdentity,
  }: {
    requestIdentity: MtnRequestIdentity;
  }): Promise<void> {
    // Check for existing valid token
    const existingToken = this.tokenCache.get(requestIdentity.referenceId);
    if (existingToken && !existingToken.expired()) {
      return;
    }

    // MTN uses Basic Authentication.
    const credentials = Buffer.from(
      `${requestIdentity.referenceId}:${requestIdentity.apiKey}`,
    ).toString('base64');

    const headers = this.mtnApiHelperService.createCommonHeaders({
      subscriptionKey: requestIdentity.subscriptionKey,
    });
    headers.set('Authorization', `Basic ${credentials}`);

    let response;
    try {
      response = await this.httpService.post<AxiosResponse<unknown>>(
        this.getTokenURL().href,
        {},
        headers,
      );
    } catch (error) {
      throw new MtnApiError({
        type: MtnTransferErrorTypes.fail,
        message: `authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    if (!this.mtnApiHelperService.isAuthenticationResponse(response?.data)) {
      throw new MtnApiError({
        type: MtnTransferErrorTypes.fail,
        message: `authentication failed: unexpected response from MTN API`,
      });
    }

    const accessToken = response.data.access_token;
    const expiresInSeconds = response.data.expires_in;

    if (expiresInSeconds <= 0) {
      throw new MtnApiError({
        type: MtnTransferErrorTypes.fail,
        message: 'authentication failed: invalid token expiry from MTN API',
      });
    }

    // We subtract 5 seconds to ensure we don't use an expired token.
    // TokenSet.expires_at expects seconds since epoch (not milliseconds).
    const expiresAtUnixSeconds =
      Math.floor(Date.now() / 1000) + expiresInSeconds - 5;

    this.tokenCache.set(
      requestIdentity.referenceId,
      new TokenSet({
        access_token: accessToken,
        expires_at: expiresAtUnixSeconds,
      }),
    );
  }
}
