import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { MtnApiAuthenticationResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-authentication-response-body.dto';
import { MtnApiCreateTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-create-transfer-request-body.dto';
import { MtnTransferErrorTypes } from '@121-service/src/fsp-integrations/integrations/mtn/enums/mtn-transfer-result.enum';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';

@Injectable()
export class MtnApiHelperService {
  public getBaseUrl(): URL {
    // Non-null assertions (!) are safe here because FspEnvVariableValidationService
    // validates at startup that all required env variables are set when MTN_MODE=EXTERNAL.
    if (env.MTN_MODE === FspMode.mock) {
      return new URL('api/fsp/mtn/', env.MOCK_SERVICE_URL);
    }
    if (!env.MTN_API_URL) {
      throw new MtnApiError({
        type: MtnTransferErrorTypes.fail,
        message: 'MTN_API_URL is not set',
      });
    }
    return new URL(env.MTN_API_URL);
  }

  public createTransferPayload({
    amount,
    currency,
    externalId,
    phoneNumber,
    message,
  }: {
    amount: string;
    currency: string;
    externalId: string;
    phoneNumber: string;
    message: string;
  }): MtnApiCreateTransferRequestBodyDto {
    return {
      amount,
      currency,
      externalId,
      payee: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber,
      },
      payerMessage: message,
      payeeNote: message,
    };
  }

  public createTransferHeaders({
    referenceId,
    subscriptionKey,
  }: {
    referenceId: string;
    subscriptionKey: string;
  }): Headers {
    const headers = this.createCommonHeaders({ subscriptionKey });
    headers.set('X-Reference-Id', referenceId);
    headers.set('X-Target-Environment', env.MTN_TARGET_ENVIRONMENT!);

    if (env.EXTERNAL_121_SERVICE_URL) {
      headers.set(
        'X-Callback-Url',
        `${env.EXTERNAL_121_SERVICE_URL}/api/fsps/mtn/transfer-callback`,
      );
    }
    return headers;
  }

  public createGetTransferHeaders({
    subscriptionKey,
  }: {
    subscriptionKey: string;
  }): Headers {
    const headers = this.createCommonHeaders({ subscriptionKey });
    headers.set('X-Target-Environment', env.MTN_TARGET_ENVIRONMENT!);

    return headers;
  }

  public createCommonHeaders({
    subscriptionKey,
  }: {
    subscriptionKey: string;
  }): Headers {
    return new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    });
  }

  public formatResponseError({
    response,
  }: {
    response?: {
      status?: number;
      statusText?: string;
      data?: unknown;
    } | null;
  }): string {
    const status = response?.status ?? 'unknown';
    const statusText = response?.statusText ?? 'unknown';
    const body = this.formatBody(response?.data);

    return body
      ? `Status: ${status}, StatusText: ${statusText}, Body: ${body}`
      : `Status: ${status}, StatusText: ${statusText}`;
  }

  private formatBody(data: unknown): string | undefined {
    if (!data) {
      return undefined;
    }
    try {
      return JSON.stringify(data);
    } catch {
      return undefined;
    }
  }

  public isAuthenticationResponse(
    data: unknown,
  ): data is MtnApiAuthenticationResponseBodyDto {
    return (
      typeof data === 'object' &&
      data !== null &&
      'access_token' in data &&
      typeof (data as Record<string, unknown>).access_token === 'string' &&
      'expires_in' in data &&
      typeof (data as Record<string, unknown>).expires_in === 'number'
    );
  }
}
