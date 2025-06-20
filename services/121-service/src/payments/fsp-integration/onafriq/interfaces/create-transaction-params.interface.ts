export interface CreateTransactionParams {
  readonly transferAmount: number;
  readonly phoneNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly thirdPartyTransId: string;
}
