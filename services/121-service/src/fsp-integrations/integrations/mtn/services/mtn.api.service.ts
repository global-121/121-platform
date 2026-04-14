import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { MtnApiCreateTransferRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/mtn/dtos/mtn-api/mtn-api-create-transfer-request-body.dto';
import { MtnApiError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api.error';
import { MtnApiDuplicateError } from '@121-service/src/fsp-integrations/integrations/mtn/errors/mtn-api-duplicate.error';
import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/create-transfer-params.interface';
import { MtnTransferStatusResponse } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-transfer-status-response.interface';
import { MtnApiHelperService } from '@121-service/src/fsp-integrations/integrations/mtn/services/mtn.api.helper.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const HTTP_STATUS_ACCEPTED = 202;
const HTTP_STATUS_CONFLICT = 409;


@Injectable()
export class MtnApiService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly mtnApiHelperService: MtnApiHelperService,
  ) {}

  public async createTransfer({
    referenceId,
    amount,
    currency,
    externalId,
    payee,
    payerMessage,
    payeeNote,
  }: CreateTransferParams): Promise<void> {
    const payload = this.mtnApiHelperService.createTransferPayload({
      referenceId,
      amount,
      currency,
      externalId,
      payee,
      payerMessage,
      payeeNote,
    });
    await this.makeTransferCall({ payload, referenceId });
  }

  public async getTransferStatus({
    referenceId,
  }: {
    referenceId: string;
  }): Promise<MtnTransferStatusResponse> {
    try {
      const url = new URL(
        `disbursement/v1_0/transfer/${referenceId}`,
        this.mtnApiHelperService.getBaseUrl(),
      );

      const headers = this.mtnApiHelperService.createGetTransferStatusHeaders();

      const response = await this.httpService.get<
        AxiosResponse<MtnTransferStatusResponse>
      >(url.toString(), headers);

      if (!response || response.status < 200 || response.status >= 300) {
        throw new MtnApiError(
          `Failed to get transfer status. Status: ${response?.status ?? 'unknown'}, StatusText: ${response?.statusText ?? 'unknown'}, Body: ${this.stringifyResponseData(response?.data)}`,
        );
      }

      return response.data;
    } catch (error) {
      if (error instanceof MtnApiError) {
        throw error;
      }
      console.error('Failed to get MTN transfer status', error);
      throw new MtnApiError(
        `Error getting transfer status: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private stringifyResponseData(data: unknown): string {
    if (data === undefined || data === null) {
      return 'empty';
    }

    try {
      return JSON.stringify(data);
    } catch {
      return '[unserializable body]';
    }
  }
  private async makeTransferCall({
    payload,
    referenceId,
  }: {
    payload: MtnApiCreateTransferRequestBodyDto;
    referenceId: string;
  }): Promise<void> {
    try {
      const url = new URL(
        'disbursement/v1_0/transfer',
        this.mtnApiHelperService.getBaseUrl(),
      );

      const headers = this.mtnApiHelperService.createTransferHeaders({
        referenceId,
      });

      const response = await this.httpService.post<AxiosResponse<void>>(
        url.toString(),
        payload,
        headers,
      );

      if (response?.status === HTTP_STATUS_CONFLICT) {
        throw new MtnApiDuplicateError(
          `Duplicate transfer request for referenceId: ${referenceId}`,
        );
      }

      if (
        !response ||
        response.status < HTTP_STATUS_ACCEPTED ||
        response.status >= 300
      ) {
        throw new MtnApiError(
          `Failed to create transfer. Status: ${response?.status ?? 'unknown'}, StatusText: ${response?.statusText ?? 'unknown'}`,
        );
      }
    } catch (error) {
      if (
        error instanceof MtnApiDuplicateError ||
        error instanceof MtnApiError
      ) {
        throw error;
      }
      console.error('Failed to make MTN B2C payment API call', error);
      throw new MtnApiError(`Error: ${error.message}`);
    }
  }
}
