// TODO: Is there a better way to create a data structure that holds this data for where it is used? #### make this an interface
export class ReferenceIdAndTransactionAmountDto {
  public readonly referenceId: string;
  public readonly transactionAmount: number;
}
