import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { env } from '@121-service/src/env';
import { MtnApiCreateTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-create-transfer-request-body.dto';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnApiKeyHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.key.helper';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class MtnService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly mtnApiKeyHelperService: MtnApiKeyHelperService,
  ) {}

  public async createTransfer(): Promise<void> {
    if (!env.MTN_REFERENCE_ID) {
      throw new MtnApiError('MTN_REFERENCE_ID is not set');
    }
    if (!env.MTN_ACCESS_TOKEN) {
      throw new MtnApiError('MTN_ACCESS_TOKEN is not set');
    }
    const url = new URL(
      'disbursement/v1_0/transfer',
      await this.mtnApiKeyHelperService.getBaseUrl(),
    );

    const headers = await this.mtnApiKeyHelperService.createCommonHeaders();
    headers.set('Authorization', `Bearer ${env.MTN_ACCESS_TOKEN}`);
    headers.set('X-Reference-Id', env.MTN_REFERENCE_ID);
    headers.set('X-Target-Environment', 'sandbox');

    const payload: MtnApiCreateTransferRequestBodyDto = {
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
