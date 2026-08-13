import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { AlfouadApiResponseDto } from '@121-service/src/fsp-integrations/integrations/alfouad/dtos/alfouad-api-response.dto';
import { AlfouadApiErrorCode } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-error-code.enum';
import { AlfouadApiTransactionStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadCreateTransferParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transfer-params.interface';
import { AlfouadCreateTransferResult } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transfer-result.interface';
import { AlfouadGetTransactionResult } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-get-transaction-result.interface';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { AlfouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.helper.service';
import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const ALFOUAD_SUCCESS_STATE = '1';

@Injectable()
export class AlfouadApiService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly alfouadApiHelperService: AlfouadApiHelperService,
    private readonly alfouadEncryptionService: AlfouadEncryptionService,
  ) {}

  public async createTransfer({
    requestIdentity,
    senderFullName,
    senderPhoneNumber,
    beneficiaryFullName,
    beneficiaryPhoneNumber,
    referenceNumber,
    countryCode,
    cityCode,
    agentCode,
    deliveryCurrencyCode,
    deliveryAmount,
    reasonCode,
  }: AlfouadCreateTransferParams): Promise<AlfouadCreateTransferResult> {
    const payload = {
      SenderFullName: senderFullName,
      SenderPhoneNumber: senderPhoneNumber,
      BeneficiaryFullName: beneficiaryFullName,
      BeneficiaryPhoneNumber: beneficiaryPhoneNumber,
      ReferenceNumber: referenceNumber,
      CountryCode: countryCode,
      CityCode: cityCode,
      AgentCode: agentCode,
      DeliveryCurrencyCode: deliveryCurrencyCode,
      DeliveryAmount: deliveryAmount,
      ReasonCode: reasonCode,
    }

    const response = await this.sendAuthenticatedRequest<AlfouadApiResponseDto>(
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

    if (body.State !== ALFOUAD_SUCCESS_STATE) {
      if (body.ErrorCode === AlfouadApiErrorCode.duplicateReferenceNumber) {
        return this.recoverDuplicateTransfer({
          referenceNumber,
          requestIdentity,
        });
      }

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

  public async getTransactionByRef({
    referenceNumber,
    requestIdentity,
  }: {
    referenceNumber: string;
    requestIdentity: AlfouadRequestIdentity;
  }): Promise<AlfouadGetTransactionResult | undefined> {
    const response = await this.sendAuthenticatedRequest<AlfouadApiResponseDto>(
      {
        method: 'GET',
        path: `api/Transaction/TransactionByRef?ReferenceNumber=${encodeURIComponent(referenceNumber)}`,
        requestIdentity,
      },
    );

    const body = response.data;
    if (!body) {
      throw new AlfouadApiError({
        message: 'No response body received from Al Fouad API',
      });
    }

    const state = this.parseTransactionState(body.State);
    if (state === undefined) {
      return state;
    }

    return { state, transactionUid: body.TransactionInfo?.TransactionUID };
  }

  private async recoverDuplicateTransfer({
    referenceNumber,
    requestIdentity,
  }: {
    referenceNumber: string;
    requestIdentity: AlfouadRequestIdentity;
  }): Promise<AlfouadCreateTransferResult> {
    const existing = await this.getTransactionByRef({
      referenceNumber,
      requestIdentity,
    });

    if (!existing?.transactionUid) {
      throw new AlfouadApiError({
        message: `Duplicate ReferenceNumber ${referenceNumber} was reported but the transaction was not found`,
        errorCode: AlfouadApiErrorCode.duplicateReferenceNumber,
      });
    }

    return { transactionUid: existing.transactionUid };
  }

  private parseTransactionState(
    state: string,
  ): AlfouadApiTransactionStateEnum | undefined {
    const validStates: string[] = Object.values(AlfouadApiTransactionStateEnum);
    return validStates.includes(state)
      ? (state as AlfouadApiTransactionStateEnum)
      : undefined;
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
          ? await this.httpService.post<AxiosResponse<T>>(url, payload, headers)
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
