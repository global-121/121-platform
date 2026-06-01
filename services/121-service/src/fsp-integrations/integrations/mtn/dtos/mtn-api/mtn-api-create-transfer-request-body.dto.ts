export class MtnApiCreateTransferRequestBodyDto {
  public readonly amount: string;
  public readonly currency: string;
  public readonly externalId: string;
  public readonly payee: {
    readonly partyIdType: string;
    readonly partyId: string;
  };
  public readonly payerMessage: string;
  public readonly payeeNote: string;
}
