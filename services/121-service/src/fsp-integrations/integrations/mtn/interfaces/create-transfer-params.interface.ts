export interface CreateTransferParams {
  readonly referenceId: string;
  readonly amount: string;
  readonly currency: string;
  readonly externalId: string;
  readonly payee: {
    readonly partyIdType: string;
    readonly partyId: string;
  };
  readonly payerMessage: string;
  readonly payeeNote: string;
}
