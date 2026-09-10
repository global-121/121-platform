import { AlFouadAuthIdentity } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-auth-identity.interface';
import { AlFouadSenderInfo } from '@121-service/src/fsp-integrations/integrations/al-fouad/interfaces/al-fouad-sender-info.interface';

export interface AlFouadCreateTransactionParams extends AlFouadSenderInfo {
  readonly beneficiaryFullName: string;
  readonly beneficiaryPhoneNumber: string;
  readonly referenceNumber: string;
  readonly countryCode: string;
  readonly cityCode: string;
  readonly deliveryCurrencyCode: string;
  readonly deliveryAmount: number;
  readonly authIdentity: AlFouadAuthIdentity;
}
