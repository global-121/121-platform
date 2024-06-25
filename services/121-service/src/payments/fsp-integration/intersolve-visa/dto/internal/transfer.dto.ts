export class TransferDto {
  public readonly fromTokenCode: string;
  public readonly toTokenCode: string;
  public readonly operationReference: string;
  public readonly amount: number;
}
