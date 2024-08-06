export interface TransferRequestDto {
  readonly quantity: {
    assetCode: string;
    value: number;
  };
  readonly creditor: {
    tokenCode: string;
  };
  readonly reference: string;
  readonly operationReference: string;
}
