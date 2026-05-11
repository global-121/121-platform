import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { MtnApiAuthenticationResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-authentication-response-body.dto';
import { MtnApiCreateTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-create-transfer-request-body.dto';
import { MtnApiErrorResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-error-response-body.dto';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';

@Injectable()
export class MtnApiHelperService {
  public getBaseUrl(): URL {
    // Non-null assertions (!) are safe here because FspEnvVariableValidationService
    // validates at startup that all required env variables are set when MTN_MODE=EXTERNAL.
    if (env.MTN_MODE === FspMode.mock) {
      return new URL('api/fsp/mtn/', env.MOCK_SERVICE_URL);
    }
    return new URL(env.MTN_API_URL!);
  }

  public createTransferPayload({
    amount,
    currency,
    externalId,
    payee,
    payerMessage,
    payeeNote,
  }: {
    amount: string;
    currency: string;
    externalId: string;
    payee: { partyIdType: string; partyId: string };
    payerMessage: string;
    payeeNote: string;
  }): MtnApiCreateTransferRequestBodyDto {
    return {
      amount,
      currency,
      externalId,
      payee: {
        partyIdType: payee.partyIdType,
        partyId: payee.partyId,
      },
      payerMessage,
      payeeNote,
    };
  }

  // Non-null assertions (!) are safe here because FspEnvVariableValidationService
  // validates at startup that all required env variables are set when MTN_MODE=EXTERNAL.
  public createTransferHeaders({
    referenceId,
  }: {
    referenceId: string;
  }): Headers {
    const headers = this.createCommonHeaders();
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

  public createGetTransferStatusHeaders(): Headers {
    const headers = this.createCommonHeaders();
    headers.set('X-Target-Environment', env.MTN_TARGET_ENVIRONMENT!);

    return headers;
  }

  private getSubscriptionKeyOrThrow(): string {
    return env.MTN_SUBSCRIPTION_KEY!;
  }

  public createCommonHeaders(): Headers {
    return new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': this.getSubscriptionKeyOrThrow(),
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
    const errorMessage = this.parseErrorMessage(response?.data);

    const parts = [
      `Status: ${status}`,
      `StatusText: ${statusText}`,
      ...(errorMessage ? [errorMessage] : []),
    ];

    return parts.join(', ');
  }

  private parseErrorMessage(data: unknown): string | undefined {
    if (!this.isMtnErrorResponse(data)) {
      if (data === undefined || data === null) {
        return undefined;
      }

      try {
        return `Body: ${JSON.stringify(data)}`;
      } catch {
        return 'Body: [unserializable body]';
      }
    }

    const parts: string[] = [];
    if (data.code) {
      parts.push(`Code: ${data.code}`);
    }
    if (data.message) {
      parts.push(`Message: ${data.message}`);
    }
    return parts.length > 0 ? parts.join(', ') : undefined;
  }

  private isMtnErrorResponse(
    data: unknown,
  ): data is MtnApiErrorResponseBodyDto {
    return (
      typeof data === 'object' &&
      data !== null &&
      'code' in data &&
      'message' in data
    );
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
