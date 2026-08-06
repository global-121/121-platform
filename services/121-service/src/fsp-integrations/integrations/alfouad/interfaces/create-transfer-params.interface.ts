export interface CreateTransferParams {
  readonly alfouadReferenceId: string;
  readonly amount: string;
  readonly currency: string;
  readonly externalId: string;
  readonly phoneNumberPayment: string;
  readonly transactionId: number;
}
