import { MtnRequestIdentity } from '@121-service/src/fsp-integrations/integrations/mtn/interfaces/mtn-request-identity.interface';

export interface MtnApiCreateTransferParams {
  readonly mtnReferenceId: string;
  readonly amount: string;
  readonly currency: string;
  readonly externalId: string;
  readonly payee: {
    readonly partyIdType: string;
    readonly partyId: string;
  };
  readonly payerMessage: string;
  readonly payeeNote: string;
  readonly requestIdentity: MtnRequestIdentity;
}
