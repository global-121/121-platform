import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { MtnApiCreateTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-create-transfer-request-body.dto';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/create-transfer-params.interface';
import { MtnApiHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class MtnApiService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly mtnApiHelperService: MtnApiHelperService,
  ) {}

  public async createTransfer({
    amount,
    currency,
    externalId,
    payee,
    payerMessage,
    payeeNote,
  }: CreateTransferParams): Promise<void> {
    const payload = this.mtnApiHelperService.createTransferPayload({
      amount,
      currency,
      externalId,
      payee,
      payerMessage,
      payeeNote,
    });

    await this.makeTransferCall(payload);
  }

  private async makeTransferCall(
    payload: MtnApiCreateTransferRequestBodyDto,
  ): Promise<void> {
    try {
      const url = new URL(
        'disbursement/v1_0/transfer',
        this.mtnApiHelperService.getBaseUrl(),
      );

      const headers = this.mtnApiHelperService.createTransferHeaders();

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
    } catch (error) {
      if (error instanceof MtnApiError) {
        throw error;
      }
      console.error('Failed to make MTN B2C payment API call', error);
      throw new MtnApiError(`Error: ${error.message}`);
    }
  }
}
