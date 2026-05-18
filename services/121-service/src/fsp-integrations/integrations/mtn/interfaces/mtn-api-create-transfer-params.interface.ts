import { MtnRequestIdentity } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-request-identity.interface';

export interface MtnApiCreateTransferParams {
  readonly mtnReferenceId: string;
  readonly amount: string;
  readonly currency: string;
  readonly externalId: string;
  readonly phoneNumber: string;
  readonly message: string;
  readonly requestIdentity: MtnRequestIdentity;
}
