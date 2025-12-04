import { OnafriqRequestIdentity } from '@121-service/src/fsp-integrations/api-integrations/onafriq/interfaces/onafriq-request-identity.interface';

export interface CreateTransactionParams {
  readonly transferValue: number;
  readonly phoneNumberPayment: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly thirdPartyTransId: string;
  readonly requestIdentity: OnafriqRequestIdentity;
}
