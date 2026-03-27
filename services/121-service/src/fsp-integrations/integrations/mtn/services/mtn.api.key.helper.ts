import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class MtnApiKeyHelperService {
  public constructor(private readonly httpService: CustomHttpService) {}

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

  public async createCommonHeaders(): Promise<Headers> {
    return new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': await this.getSubscriptionKeyOrThrow(),
    });
  }
}
