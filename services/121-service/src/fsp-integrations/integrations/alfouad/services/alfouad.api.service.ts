import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import {
  ALFOUAD_AGENT_CODE,
  ALFOUAD_RELATIONSHIP,
} from '@121-service/src/fsp-integrations/integrations/alfouad/alfouad.config';
import { AlfouadApiCreateTransactionResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/alfouad/dtos/alfouad-api-create-transaction-response-body.dto';
import { AlfouadApiGetTransactionResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/alfouad/dtos/alfouad-api-get-transaction-response-body.dto';
import { AlfouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/alfouad/enums/alfouad-api-transaction-state.enum';
import { AlfouadApiError } from '@121-service/src/fsp-integrations/integrations/alfouad/errors/alfouad-api.error';
import { AlfouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-auth-identity.interface';
import { AlfouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-params.interface';
import { AlfouadCreateTransactionResult } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-create-transaction-result.interface';
import { AlfouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.api.helper.service';
import { AlfouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/alfouad/services/alfouad.encryption.service';
import { SensitivePiiValue } from '@121-service/src/shared/consts/sensitive-pii-value.class';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const ALFOUAD_SUCCESS_STATE = '1';

@Injectable()
export class AlfouadApiService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly alfouadApiHelperService: AlfouadApiHelperService,
    private readonly alfouadEncryptionService: AlfouadEncryptionService,
  ) {}

  public async createTransaction({
    authIdentity,
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
      SenderFullName: new SensitivePiiValue(senderFullName),
      SenderPhoneNumber: new SensitivePiiValue(senderPhoneNumber),
      BeneficiaryFullName: new SensitivePiiValue(beneficiaryFullName),
      BeneficiaryPhoneNumber: new SensitivePiiValue(beneficiaryPhoneNumber),
      ReferenceNumber: referenceNumber,
      CountryCode: countryCode,
      CityCode: cityCode,
      AgentCode: ALFOUAD_AGENT_CODE,
      DeliveryCurrencyCode: deliveryCurrencyCode,
      DeliveryAmount: deliveryAmount,
      RelationShip: ALFOUAD_RELATIONSHIP,
    };

    const response = await this.sendAuthenticatedRequest<AlfouadApiCreateTransactionResponseBodyDto>(
      {
        method: 'POST',
        path: 'api/Transaction/TransactionCreate',
        payload,
        authIdentity,
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
    authIdentity,
  }: {
    referenceNumber: string;
    authIdentity: AlfouadAuthIdentity;
  }): Promise<AlfouadApiTransactionState | undefined> {
    const response = await this.sendAuthenticatedRequest<AlfouadApiGetTransactionResponseBodyDto>(
      {
        method: 'GET',
        path: `api/Transaction/TransactionByRef?ReferenceNumber=${encodeURIComponent(referenceNumber)}`,
        authIdentity,
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
    authIdentity,
  }: {
    method: 'GET' | 'POST';
    path: string;
    payload?: unknown;
    authIdentity: AlfouadAuthIdentity;
  }): Promise<AxiosResponse<T>> {
    let response: AxiosResponse<T>;

    try {
      response = await this.alfouadRequest<T>({
        method,
        path,
        payload,
        authIdentity,
      });
    } catch (error) {
      throw new AlfouadApiError({
        message: `Error calling ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    if (!response.data) {
      throw new AlfouadApiError({
        message: `No response received from Al Fouad API for ${path}.`,
      });
    }

    return response;
  }

  private async alfouadRequest<T>({
    method,
    path,
    payload,
    authIdentity,
  }: {
    method: 'GET' | 'POST';
    path: string;
    payload?: unknown;
    authIdentity: AlfouadAuthIdentity;
  }): Promise<AxiosResponse<T>> {
    const headers = this.buildAuthHeaders({ authIdentity });
    const url = this.buildRequestUrl(path);

    switch (method) {
      case 'POST':
        return await this.httpService.post<AxiosResponse<T>>(
          url,
          payload,
          headers,
        );
      case 'GET':
        return await this.httpService.get<AxiosResponse<T>>(url, headers);
    }
  }

  private buildAuthHeaders({
    authIdentity,
  }: {
    authIdentity: AlfouadAuthIdentity;
  }): Headers {
    const encryptedPassword = this.alfouadEncryptionService.encrypt({
      data: authIdentity.password,
      publicKeyXml: authIdentity.publicKey,
    });

    const authorizationToken =
      this.alfouadApiHelperService.buildAuthorizationToken({
        account: authIdentity.account,
        branchId: authIdentity.branchId,
        username: authIdentity.username,
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
