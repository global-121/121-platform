import { MtnRequestIdentity } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-request-identity.interface';

export interface CreateTransferParams {
  readonly mtnReferenceId: string;
  readonly amount: string;
  readonly currency: string;
  readonly externalId: string;
  readonly phoneNumber: string;
  readonly transactionId: number;
  readonly requestIdentity: MtnRequestIdentity;
}
