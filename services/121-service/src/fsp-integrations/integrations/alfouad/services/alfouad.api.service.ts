import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import {
  ALFOUAD_AGENT_CODE,
  ALFOUAD_RELATIONSHIP,
} from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.config';
import { AlfouadApiCreateTransactionResponseDto } from '@121-service/src/fsp-integrations/integrations/alfouad/dtos/alfouad-api-create-transaction-response.dto';
import { AlfouadApiGetTransactionResponseDto } from '@121-service/src/fsp-integrations/integrations/alfouad/dtos/alfouad-api-get-transaction-response.dto';
import { AlfouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-params.interface';
import { AlfouadCreateTransactionResult } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-result.interface';
import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';
import { AlfouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.helper.service';
import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class AlfouadApiService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly alfouadApiHelperService: AlfouadApiHelperService,
    private readonly alfouadEncryptionService: AlfouadEncryptionService,
  ) {}

  public async createTransaction({
    requestIdentity,
    senderFullName,
    senderPhoneNumber,
    beneficiaryFullName,
    beneficiaryPhoneNumber,
    referenceNumber,
    countryCode,
    cityCode,
    deliveryCurrencyCode,
    deliveryAmount,
  }: AlfouadCreateTransactionParams): Promise<AlfouadCreateTransactionResult> {
    const payload = {
      SenderFullName: senderFullName,
      SenderPhoneNumber: senderPhoneNumber,
      BeneficiaryFullName: beneficiaryFullName,
      BeneficiaryPhoneNumber: beneficiaryPhoneNumber,
      ReferenceNumber: referenceNumber,
      CountryCode: countryCode,
      CityCode: cityCode,
      AgentCode: ALFOUAD_AGENT_CODE,
      DeliveryCurrencyCode: deliveryCurrencyCode,
      DeliveryAmount: deliveryAmount,
      RelationShip: ALFOUAD_RELATIONSHIP,
    }

    const response = await this.sendAuthenticatedRequest<AlfouadApiCreateTransactionResponseDto>(
      {
        method: 'POST',
        path: 'api/Transaction/TransactionCreate',
        payload,
        requestIdentity,
      },
    );

    const { State, Message, ErrorCode } = response.data;

    return {
      state: State,
      message: Message,
      errorCode: ErrorCode,
    };
  }

  public async getTransactionStateByRef({
    referenceNumber,
    requestIdentity,
  }: {
    referenceNumber: string;
    requestIdentity: AlfouadRequestIdentity;
  }): Promise<AlfouadApiTransactionState | undefined> {
    const response = await this.sendAuthenticatedRequest<AlfouadApiGetTransactionResponseDto>(
      {
        method: 'GET',
        path: `api/Transaction/TransactionByRef?ReferenceNumber=${encodeURIComponent(referenceNumber)}`,
        requestIdentity,
      },
    );

    const transaction = response.data;

    return this.parseTransactionState(transaction.State);
  }

  private parseTransactionState(
    state: string,
  ): AlfouadApiTransactionState | undefined {
    const validStates: string[] = Object.values(AlfouadApiTransactionState);

    if (!validStates.includes(state)) {
      return undefined;
    }

    return state as AlfouadApiTransactionState;
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
