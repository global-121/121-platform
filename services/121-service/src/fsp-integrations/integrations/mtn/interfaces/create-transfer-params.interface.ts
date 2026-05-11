export interface CreateTransferParams {
  readonly mtnReferenceId: string;
  readonly amount: string;
  readonly currency: string;
  readonly externalId: string;
  readonly phoneNumber: string;
  readonly transactionId: number;
}
