import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { MtnApiCreateTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-create-transfer-request-body.dto';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/create-transfer-params.interface';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';

@Injectable()
export class MtnApiHelperService {
  public getBaseUrl(): URL {
    if (env.MTN_MODE === FspMode.mock) {
      return new URL('api/fsp/mtn/', env.MOCK_SERVICE_URL);
    }
    if (!env.MTN_API_URL) {
      throw new MtnApiError('MTN_API_URL is not set');
    }
    return new URL(env.MTN_API_URL);
  }

  public createTransferPayload({
    amount,
    currency,
    externalId,
    payee,
    payerMessage,
    payeeNote,
  }: CreateTransferParams): MtnApiCreateTransferRequestBodyDto {
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

  public createTransferHeaders({
    referenceId,
  }: {
    referenceId: string;
  }): Headers {
    if (!env.MTN_ACCESS_TOKEN) {
      throw new MtnApiError('MTN_ACCESS_TOKEN is not set');
    }
    if (!env.MTN_TARGET_ENVIRONMENT) {
      throw new MtnApiError('MTN_TARGET_ENVIRONMENT is not set');
    }

    const headers = this.createCommonHeaders();
    headers.set('Authorization', `Bearer ${env.MTN_ACCESS_TOKEN}`);
    headers.set('X-Reference-Id', referenceId);
    headers.set('X-Target-Environment', env.MTN_TARGET_ENVIRONMENT);

    if (env.MTN_PROVIDER_CALLBACK_HOST) {
      headers.set(
        'X-Callback-Url',
        `${env.MTN_PROVIDER_CALLBACK_HOST}/fsps/mtn/transfer-callback`,
      );
    }

    return headers;
  }

  public createGetTransferStatusHeaders(): Headers {
    if (!env.MTN_ACCESS_TOKEN) {
      throw new MtnApiError('MTN_ACCESS_TOKEN is not set');
    }
    if (!env.MTN_TARGET_ENVIRONMENT) {
      throw new MtnApiError('MTN_TARGET_ENVIRONMENT is not set');
    }

    const headers = this.createCommonHeaders();
    headers.set('Authorization', `Bearer ${env.MTN_ACCESS_TOKEN}`);
    headers.set('X-Target-Environment', env.MTN_TARGET_ENVIRONMENT);

    return headers;
  }

  private getSubscriptionKeyOrThrow(): string {
    if (!env.MTN_SUBSCRIPTION_KEY) {
      throw new MtnApiError('MTN_SUBSCRIPTION_KEY is not set');
    }
    return env.MTN_SUBSCRIPTION_KEY;
  }

  private createCommonHeaders(): Headers {
    return new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': this.getSubscriptionKeyOrThrow(),
    });
  }
}
