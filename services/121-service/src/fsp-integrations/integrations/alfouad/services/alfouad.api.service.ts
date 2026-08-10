import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { AlfouadApiCreateTransactionResponseBody } from '@121-service/src/fsp-integrations/integrations/alfouad/dtos/create-transaction-response-body.dto';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/create-transfer-params.interface';
import { CreateTransferResult } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/create-transfer-result.interface';
import { AlfouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.helper.service';
import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

// The Al Fouad API returns HTTP 200 with `State` "1" on success and "0" on a
// business failure (in which case `ErrorCode` is populated).
const SUCCESS_STATE = '1';

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
    const headers = this.buildAuthHeaders({ requestIdentity });
    const payload =
      this.alfouadApiHelperService.createTransactionPayload(transaction);
    const url = new URL(
      'api/Transaction/TransactionCreate',
      this.alfouadApiHelperService.getBaseUrl(),
    );

    let response: AxiosResponse<AlfouadApiCreateTransactionResponseBody>;
    try {
      response = await this.httpService.post<
        AxiosResponse<AlfouadApiCreateTransactionResponseBody>
      >(url.toString(), payload, headers);
    } catch (error) {
      throw new AlfouadApiError({
        message: `Error creating transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    if (!response || response.status < 200 || response.status >= 300) {
      throw new AlfouadApiError({
        message: `Failed to create transaction (HTTP ${response?.status ?? 'unknown'}).`,
      });
    }

    const body = response.data;
    if (body?.State !== SUCCESS_STATE) {
      throw new AlfouadApiError({
        message: body?.Message ?? 'Unknown error',
        errorCode: body?.ErrorCode,
      });
    }

    const transactionUid = body.TransactionInfo?.transactionUid;
    if (!transactionUid) {
      throw new AlfouadApiError({
        message: 'Transaction created but no TransactionUID was returned',
      });
    }

    return { transactionUid };
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
