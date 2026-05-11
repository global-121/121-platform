import { HttpStatus, Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';
import { TokenSet } from 'openid-client';

import { env } from '@121-service/src/env';
import { MtnApiAuthenticationResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-authentication-response-body.dto';
import { MtnApiCreateTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-create-transfer-request-body.dto';
import { MtnTransferResult } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-result.enum';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnApiCreateTransferParams } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-api-create-transfer-params.interface';
import { MtnTransferStatusResponse } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-transfer-status-response.interface';
import { MtnApiHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class MtnApiService {
  private tokenSet: TokenSet;
  private readonly mtnReferenceId: string | undefined;
  private readonly mtnApiKey: string | undefined;

  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly mtnApiHelperService: MtnApiHelperService,
  ) {
    this.mtnReferenceId = env.MTN_REFERENCE_ID;
    this.mtnApiKey = env.MTN_API_KEY;
  }

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

  private addAuthHeaders(headers: Headers): Headers {
    if (!this.tokenSet || !this.tokenSet.access_token) {
      throw new MtnApiError({
        type: MtnTransferResult.fail,
        message: 'No access token available for MTN API requests',
      });
    }
    headers.set('Authorization', `Bearer ${this.tokenSet.access_token}`);
    return headers;
  }

  public async createTransfer({
    mtnReferenceId,
    amount,
    currency,
    externalId,
    payee,
    payerMessage,
    payeeNote,
  }: MtnApiCreateTransferParams): Promise<void> {
    await this.authenticate();
    const payload = this.mtnApiHelperService.createTransferPayload({
      amount,
      currency,
      externalId,
      payee,
      payerMessage,
      payeeNote,
    });
    await this.getTransfer({ payload, referenceId: mtnReferenceId });
  }

  public async getTransferStatus({
    referenceId,
  }: {
    referenceId: string;
  }): Promise<MtnTransferStatusResponse> {
    await this.authenticate();

    const url = new URL(`${this.getTransferUrl()}/${referenceId}`);

    const headers = this.addAuthHeaders(
      this.mtnApiHelperService.createGetTransferStatusHeaders(),
    );

    try {
      const response = await this.httpService.get<
        AxiosResponse<MtnTransferStatusResponse>
      >(url.toString(), headers);

      console.log(
        `[MTN API] Get status response - referenceId: ${referenceId}, status: ${response.status}, data:`,
        JSON.stringify(response.data),
      );

      if (!response || response.status < 200 || response.status >= 300) {
        throw new MtnApiError({
          type: MtnTransferResult.fail,
          message: `Failed to get transfer status. ${this.mtnApiHelperService.formatResponseError({ response })}`,
        });
      }

      return response.data;
    } catch (error) {
      if (error instanceof MtnApiError) {
        throw error;
      }
      console.error('Failed to get MTN transfer status', error);
      throw new MtnApiError({
        type: MtnTransferResult.fail,
        message: `Error getting transfer status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  private async getTransfer({
    payload,
    referenceId,
  }: {
    payload: MtnApiCreateTransferRequestBodyDto;
    referenceId: string;
  }): Promise<void> {
    const url = this.getTransferUrl();

    const headers = this.addAuthHeaders(
      this.mtnApiHelperService.createTransferHeaders({
        referenceId,
      }),
    );

    console.log(
      `[MTN API] Making transfer call - referenceId: ${referenceId}, payload:`,
      JSON.stringify(payload),
    );

    try {
      const response = await this.httpService.post<AxiosResponse<void>>(
        url.toString(),
        payload,
        headers,
      );
      console.log(
        `[MTN API] Transfer response - referenceId: ${referenceId}, status: ${response.status}`,
      );

      if (response?.status === HttpStatus.CONFLICT) {
        throw new MtnApiError({
          type: MtnTransferResult.duplicate,
          message: `Duplicate transfer request for referenceId: ${referenceId}`,
        });
      }

      if (
        !response ||
        response.status < HttpStatus.ACCEPTED ||
        response.status >= 300
      ) {
        throw new MtnApiError({
          type: MtnTransferResult.fail,
          message: `Failed to create transfer. ${this.mtnApiHelperService.formatResponseError({ response })}`,
        });
      }
    } catch (error) {
      if (error instanceof MtnApiError) {
        throw error;
      }
      console.error('Failed to make MTN B2C payment API call', error);
      throw new MtnApiError({
        type: MtnTransferResult.fail,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  private async authenticate(): Promise<void> {
    if (!this.mtnReferenceId) {
      throw new MtnApiError({
        type: MtnTransferResult.fail,
        message: 'MTN_REFERENCE_ID is not set',
      });
    }
    if (!this.mtnApiKey) {
      throw new MtnApiError({
        type: MtnTransferResult.fail,
        message: 'MTN_API_KEY is not set',
      });
    }

    // MTN uses Basic Authentication.
    const credentials = Buffer.from(
      `${this.mtnReferenceId}:${this.mtnApiKey}`,
    ).toString('base64');

    const headers = this.mtnApiHelperService.createCommonHeaders();
    headers.set('Authorization', `Basic ${credentials}`);

    let response;
    try {
      // We don't actually validate that the API returns this.
      // Refactor: add validation.
      response = await this.httpService.post<
        AxiosResponse<MtnApiAuthenticationResponseBodyDto>
      >(this.getTokenURL().href, {}, headers);
    } catch (error) {
      throw new MtnApiError({
        type: MtnTransferResult.fail,
        message: `authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    // Refactor: add validation.
    const accessToken = response?.data?.access_token;
    const expiresInSeconds = response?.data?.expires_in;

    if (!accessToken || !expiresInSeconds || expiresInSeconds <= 0) {
      // Unlikely to go wrong, so bad ROI in throwing more specific errors.
      throw new MtnApiError({
        type: MtnTransferResult.fail,
        message: 'authentication failed: unclear response from MTN API',
      });
    }

    // We subtract 5 seconds to ensure we don't use an expired token.
    const expiresAtUnixTimestamp = (expiresInSeconds - 5) * 1000 + Date.now();

    this.tokenSet = new TokenSet({
      access_token: accessToken,
      expires_at: expiresAtUnixTimestamp,
    });
  }
}
