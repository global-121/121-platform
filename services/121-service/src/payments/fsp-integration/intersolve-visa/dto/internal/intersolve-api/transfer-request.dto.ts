export class TransferRequestDto {
  public readonly quantity: {
    assetCode: string;
    value: number;
  };
  public readonly creditor: {
    tokenCode: string;
  };
  public readonly reference: string;
  public readonly operationReference: string;
}
