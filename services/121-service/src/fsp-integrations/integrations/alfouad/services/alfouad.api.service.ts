import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import { AlfouadApiResponseDto } from '@121-service/src/fsp-integrations/integrations/alfouad/dtos/alfouad-api-response.dto';
import { AlfouadApiErrorCode } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-error-code.enum';
import { AlfouadApiTransactionStateEnum } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadCreateTransferParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transfer-params.interface';
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
  }: AlfouadCreateTransferParams): Promise<void> {
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
        message: 'No response received from Al Fouad',
      });
    }

    if (body.State === ALFOUAD_SUCCESS_STATE) {
      return;
    }

    if (body.ErrorCode === AlfouadApiErrorCode.duplicateReferenceNumber) {
      await this.checkDuplicateTransactionState({ referenceNumber, requestIdentity });
      return;
    }

    throw new AlfouadApiError({
      message: body.Message ?? 'Unknown error',
      errorCode: body.ErrorCode,
    });
  }

  public async getTransactionStateByRef({
    referenceNumber,
    requestIdentity,
  }: {
    referenceNumber: string;
    requestIdentity: AlfouadRequestIdentity;
  }): Promise<AlfouadApiTransactionStateEnum | undefined> {
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
        message: 'No response received from Al Fouad',
      });
    }

    const state = this.parseTransactionState(body.State);

    return state;
  }

  private async checkDuplicateTransactionState({
    referenceNumber,
    requestIdentity,
  }: {
    referenceNumber: string;
    requestIdentity: AlfouadRequestIdentity;
  }): Promise<void> {
    const transactionState = await this.getTransactionStateByRef({
      referenceNumber,
      requestIdentity,
    });

    if (!transactionState) {
      throw new AlfouadApiError({
        message: `Duplicate ReferenceNumber ${referenceNumber} was reported but the transaction was not found`,
        errorCode: AlfouadApiErrorCode.duplicateReferenceNumber,
      });
    }
  }

  private parseTransactionState(
    state: string,
  ): AlfouadApiTransactionStateEnum | undefined {
    const validStates: string[] = Object.values(AlfouadApiTransactionStateEnum);

    if (!validStates.includes(state)) {
      return undefined;
    }

    return state as AlfouadApiTransactionStateEnum;
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
    let response: AxiosResponse<T>;

    try {
      response = await this.alfouadRequest<T>({
        method,
        path,
        payload,
        requestIdentity,
      });
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

  private async alfouadRequest<T>({
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
    const url = this.buildRequestUrl(path);

    return method === 'POST'
      ? await this.httpService.post<AxiosResponse<T>>(url, payload, headers)
      : await this.httpService.get<AxiosResponse<T>>(url, headers);
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

   const authorizationToken =
      this.alfouadApiHelperService.buildAuthorizationToken({
        account: requestIdentity.account,
        branchId: requestIdentity.branchId,
        username: requestIdentity.username,
        encryptedPassword,
      });

    return this.alfouadApiHelperService.createRequestHeaders({
      authorizationToken,
    });
  }

  private buildRequestUrl(path: string): string {
    const baseUrl = this.alfouadApiHelperService.getBaseUrl();
    const url = new URL(path, baseUrl);

    return url.toString();
  }
}
