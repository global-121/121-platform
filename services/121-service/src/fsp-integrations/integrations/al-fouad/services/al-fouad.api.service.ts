import { Injectable } from '@nestjs/common';
import { AxiosResponse } from '@nestjs/terminus/dist/health-indicator/http/axios.interfaces';

import {
  AL_FOUAD_AGENT_CODE,
  AL_FOUAD_RELATIONSHIP,
} from '@121-service/src/fsp-integrations/integrations/al-fouad/al-fouad.config';
import { AlFouadApiCreateTransactionResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/al-fouad/dtos/al-fouad-api-create-transaction-response-body.dto';
import { AlFouadApiGetTransactionResponseBodyDto } from '@121-service/src/fsp-integrations/integrations/al-fouad/dtos/al-fouad-api-get-transaction-response-body.dto';
import { AlFouadApiTransactionState } from '@121-service/src/fsp-integrations/integrations/al-fouad/enums/al-fouad-api-transaction-state.enum';
import { AlFouadApiError } from '@121-service/src/fsp-integrations/integrations/al-fouad/errors/al-fouad-api.error';
import { AlFouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-auth-identity.interface';
import { AlFouadCreateTransactionParams } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-create-transaction-params.interface';
import { AlFouadCreateTransactionResult } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-create-transaction-result.interface';
import { AlFouadApiHelperService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.api.helper.service';
import { AlFouadEncryptionService } from '@121-service/src/fsp-integrations/integrations/al-fouad/services/al-fouad.encryption.service';
import { SensitivePiiValue } from '@121-service/src/shared/consts/sensitive-pii-value.class';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

@Injectable()
export class AlFouadApiService {
  public constructor(
    private readonly httpService: CustomHttpService,
    private readonly alFouadApiHelperService: AlFouadApiHelperService,
    private readonly alFouadEncryptionService: AlFouadEncryptionService,
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
  }: AlFouadCreateTransactionParams): Promise<AlFouadCreateTransactionResult> {
    const payload = {
      SenderFullName: new SensitivePiiValue(senderFullName),
      SenderPhoneNumber: new SensitivePiiValue(senderPhoneNumber),
      BeneficiaryFullName: new SensitivePiiValue(beneficiaryFullName),
      BeneficiaryPhoneNumber: new SensitivePiiValue(beneficiaryPhoneNumber),
      ReferenceNumber: referenceNumber,
      CountryCode: countryCode,
      CityCode: cityCode,
      AgentCode: AL_FOUAD_AGENT_CODE,
      DeliveryCurrencyCode: deliveryCurrencyCode,
      DeliveryAmount: deliveryAmount,
      RelationShip: AL_FOUAD_RELATIONSHIP,
    };

    const response = await this.sendAuthenticatedRequest<AlFouadApiCreateTransactionResponseBodyDto>(
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
    authIdentity: AlFouadAuthIdentity;
  }): Promise<AlFouadApiTransactionState | undefined> {
    const response = await this.sendAuthenticatedRequest<AlFouadApiGetTransactionResponseBodyDto>(
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
  ): AlFouadApiTransactionState | undefined {
    const validStates: string[] = Object.values(AlFouadApiTransactionState);

    if (!validStates.includes(state)) {
      return undefined;
    }

    return state as AlFouadApiTransactionState;
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
    authIdentity: AlFouadAuthIdentity;
  }): Promise<AxiosResponse<T>> {
    let response: AxiosResponse<T>;

    try {
      response = await this.alFouadRequest<T>({
        method,
        path,
        payload,
        authIdentity,
      });
    } catch (error) {
      throw new AlFouadApiError({
        message: `Error calling ${path}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }

    if (!response.data) {
      throw new AlFouadApiError({
        message: `No response received from Al Fouad API for ${path}.`,
      });
    }

    return response;
  }

  private async alFouadRequest<T>({
    method,
    path,
    payload,
    authIdentity,
  }: {
    method: 'GET' | 'POST';
    path: string;
    payload?: unknown;
    authIdentity: AlFouadAuthIdentity;
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
    authIdentity: AlFouadAuthIdentity;
  }): Headers {
    const encryptedPassword = this.alFouadEncryptionService.encrypt({
      data: authIdentity.password,
      publicKeyXml: authIdentity.publicKey,
    });

    const authorizationToken =
      this.alFouadApiHelperService.buildAuthorizationToken({
        account: authIdentity.account,
        branchId: authIdentity.branchId,
        username: authIdentity.username,
        encryptedPassword,
      });

    return this.alFouadApiHelperService.createRequestHeaders({
      authorizationToken,
    });
  }

  private buildRequestUrl(path: string): string {
    const baseUrl = this.alFouadApiHelperService.getBaseUrl();
    const url = new URL(path, baseUrl);

    return url.toString();
  }
}
