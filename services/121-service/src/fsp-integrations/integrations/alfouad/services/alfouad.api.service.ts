import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { AlfouadApiCreateTransactionResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/alfouad/dtos/alfouad-api-create-transaction-response-body.dto';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/create-transfer-params.interface';
import { CreateTransferResult } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/create-transfer-result.interface';
import { AlfouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.helper.service';
import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const ALFOUAD_SUCCES_STATE = '1';

@Injectable()
export class AlfouadApiService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly alfouadApiHelperService: AlfouadApiHelperService,
    private readonly alfouadEncryptionService: AlfouadEncryptionService,
  ) {}

  public async createTransfer({
    requestIdentity,
    ...transaction
  }: CreateTransferParams): Promise<CreateTransferResult> {
    const payload =
      this.alfouadApiHelperService.createTransactionPayload(transaction);

    const response =
      await this.sendAuthenticatedRequest<AlfouadApiCreateTransactionResponseBodyDto>(
        {
          method: 'POST',
          path: 'api/Transaction/TransactionCreate',
          payload,
          requestIdentity,
        },
      );

    const body = response.data;

    if (!body) {
      throw new AlfouadApiError({
        message: 'No response body received from Al Fouad API',
      });
    }

    if (body.State !== ALFOUAD_SUCCES_STATE) {
      throw new AlfouadApiError({
        message: body.Message ?? 'Unknown error',
        errorCode: body.ErrorCode,
      });
    }

    const transactionUid = body.TransactionInfo?.TransactionUID;
    if (!transactionUid) {
      throw new AlfouadApiError({
        message: 'Transaction created but no TransactionUID was returned',
      });
    }

    return { transactionUid };
  }

  private async sendAuthenticatedRequest<T>({
    method,
    path,
    payload,
    requestIdentity,
  }: {
    method: 'GET' | 'POST';
    path: string;
    payload?: unknown;
    requestIdentity: AlfouadRequestIdentity;
  }): Promise<AxiosResponse<T>> {
    const headers = this.buildAuthHeaders({ requestIdentity });
    const url = new URL(
      path,
      this.alfouadApiHelperService.getBaseUrl(),
    ).toString();

    let response: AxiosResponse<T>;
    try {
      response =
        method === 'POST'
          ? await this.httpService.post<AxiosResponse<T>>(
              url,
              payload,
              headers,
            )
          : await this.httpService.get<AxiosResponse<T>>(url, headers);
    } catch (error) {
      throw new AlfouadApiError({
        message: `Error calling ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    if (!response || response.status < 200 || response.status >= 300) {
      throw new AlfouadApiError({
        message: `Request to ${path} failed (HTTP ${response?.status ?? 'unknown'}).`,
      });
    }

    return response;
  }

  private buildAuthHeaders({
    requestIdentity,
  }: {
    requestIdentity: AlfouadRequestIdentity;
  }): Headers {
    const encryptedPassword = this.alfouadEncryptionService.encrypt({
      data: requestIdentity.password,
      publicKeyXml: requestIdentity.publicKey,
    });
    const authorizationValue =
      this.alfouadApiHelperService.buildAuthorizationValue({
        account: requestIdentity.account,
        branchId: requestIdentity.branchId,
        username: requestIdentity.username,
        encryptedPassword,
      });
    return this.alfouadApiHelperService.createRequestHeaders({
      authorizationValue,
    });
  }
}
