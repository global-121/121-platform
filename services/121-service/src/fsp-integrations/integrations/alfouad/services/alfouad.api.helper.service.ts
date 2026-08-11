import { Injectable } from '@nestjs/common';

import { env } from '@121-service/src/env';
import { AlFouadCreateTransactionRequestBodyDto } from '@121-service/src/fsp-integrations/integrations/alfouad/dtos/alfouad-api-create-transaction-request-body.dto';
import { CreateTransferParams } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/create-transfer-params.interface';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';

const AGENT_CODE_CASH_PICKUP_ANYWHERE = 0;

@Injectable()
export class AlfouadApiHelperService {
  public getBaseUrl(): URL {
    if (env.ALFOUAD_MODE === FspMode.mock) {
      return new URL('api/fsp/alfouad/', env.MOCK_SERVICE_URL);
    }
    return new URL(`${env.ALFOUAD_API_URL!}/`);
  }

  public buildAuthorizationValue({
    account,
    branchId,
    username,
    encryptedPassword,
  }: {
    account: string;
    branchId: string;
    username: string;
    encryptedPassword: string;
  }): string {
    const xml =
      `<Authentication>` +
      `<Account>${this.escapeXml(account)}</Account>` +
      `<BranchId>${this.escapeXml(branchId)}</BranchId>` +
      `<UserName>${this.escapeXml(username)}</UserName>` +
      `<Password>${this.escapeXml(encryptedPassword)}</Password>` +
      `</Authentication>`;
    return Buffer.from(xml, 'utf8').toString('base64');
  }

  public createRequestHeaders({
    authorizationValue,
  }: {
    authorizationValue: string;
  }): Headers {
    return new Headers({
      Authorization: `Bearer ${authorizationValue}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
  }

  public createTransactionPayload({
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
  }: Omit<CreateTransferParams, 'requestIdentity'>): AlFouadCreateTransactionRequestBodyDto {
    return {
      SenderFullName: senderFullName,
      SenderPhoneNumber: senderPhoneNumber,
      BeneficiaryFullName: beneficiaryFullName,
      BeneficiaryPhoneNumber: beneficiaryPhoneNumber,
      ReferenceNumber: referenceNumber,
      CountryCode: countryCode,
      CityCode: cityCode,
      AgentCode: agentCode ?? AGENT_CODE_CASH_PICKUP_ANYWHERE,
      DeliveryCurrencyCode: deliveryCurrencyCode,
      DeliveryAmount: deliveryAmount,
      ReasonCode: reasonCode,
    };
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
