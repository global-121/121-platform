import { AlfouadRequestIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-request-identity.interface';

export interface AlfouadCreateTransferParams {
  readonly senderFullName: string;
  readonly senderPhoneNumber: string;
  readonly beneficiaryFullName: string;
  readonly beneficiaryPhoneNumber: string;
  readonly referenceNumber: string;
  readonly countryCode: string;
  readonly cityCode: string;
  readonly deliveryCurrencyCode: string;
  readonly deliveryAmount: number;
  readonly agentCode?: number;
  readonly requestIdentity: AlfouadRequestIdentity;
}
