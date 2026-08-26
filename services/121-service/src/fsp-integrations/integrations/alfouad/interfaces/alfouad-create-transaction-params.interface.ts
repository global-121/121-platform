import { AlfouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-auth-identity.class';
import { AlfouadSenderInfo } from '@121-service/src/fsp-integrations/integrations/alfouad/interfaces/alfouad-sender-info.interface';

export interface AlfouadCreateTransactionParams extends AlfouadSenderInfo {
  readonly beneficiaryFullName: string;
  readonly beneficiaryPhoneNumber: string;
  readonly referenceNumber: string;
  readonly countryCode: string;
  readonly cityCode: string;
  readonly deliveryCurrencyCode: string;
  readonly deliveryAmount: number;
  readonly authIdentity: AlfouadAuthIdentity;
}
