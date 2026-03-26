import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { MtnApiCreateTransferRequestBody } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/create-transfer-request-body-mtn-api.dto';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnApiKeyHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.key.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class MtnService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly mtnApiKeyHelperService: MtnApiKeyHelperService,
  ) {}

  public async createTransfer(): Promise<void> {
    const { accessToken, referenceId } =
      await this.mtnApiKeyHelperService.getAccessToken();

    const url = new URL(
      'disbursement/v1_0/transfer',
      await this.mtnApiKeyHelperService.getBaseUrl(),
    );

    const headers = new Headers();
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('X-Reference-Id', referenceId);
    headers.set('X-Target-Environment', 'sandbox');
    headers.set('Content-Type', 'application/json');
    headers.set('Cache-Control', 'no-cache');
    headers.set(
      'Ocp-Apim-Subscription-Key',
      await this.mtnApiKeyHelperService.getSubscriptionKeyOrThrow(),
    );

    const payload: MtnApiCreateTransferRequestBody = {
      amount: '140',
      currency: 'EUR',
      externalId: 'CTOMPAY212268VFR',
      payee: {
        partyIdType: 'MSISDN',
        partyId: '26878342874',
      },
      payerMessage:
        'MOMOBS Pay from Bank Card VISA xxxx-xxxx-xxxx-3958 to MoMo Account 26878342874 at EUR 140.00 disbursement',
      payeeNote:
        'MOMOBS Pay from Bank Card VISA xxxx-xxxx-xxxx-3958 to MoMo Account 26878342874 at EUR 140.00 disbursement',
    };

    const response = await this.httpService.post<AxiosResponse<void>>(
      url.toString(),
      payload,
      headers,
    );

    if (!response || response.status < 202 || response.status >= 300) {
      throw new MtnApiError(
        `Failed to create transfer. Status: ${response?.status ?? 'unknown'}, StatusText: ${response?.statusText ?? 'unknown'}`,
      );
    }
  }
}
